import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from "./envfile";

export interface Trabalho {
  idTrabalho: number;
  nomePaciente: string;
  ordensDeServico: OrdemDeServico[]
  idPaciente: number;
}

export interface Devolucoes {
  idOrdemServicoItem: number;
  quantidadeDevolvida: number;
  status: string;
}
export interface OrdemDeServico {
  idOrdemServico: number;
  idTrabalho: number;
  status: string;
  valorTotal: string;
  trabalho: {
    idPaciente: number;
    nomePaciente: string;
    status: string;
    retrabalho: boolean;
  };
  itens: {
    idOrdemServicoItem: number;
    idReferencia?: number;
    descricao: string;
    valor: string;
    valorTotal: string;
    quantidade: number;
    quantidadeDevolvida?: number;
    tipoCobranca: string;
    tipo: string;
    status: string;
    devolucoes?: Devolucoes[];
  } [ ]
}

export interface PagarItensPayload {
  idFatura: number;
  idConta: number;
  dataPagamento: string;
  meioPagamento: string;
  itens: {
    idOrdemServicoItem: number;
    valor: number;
  }[];
}

export interface EmpresaFatura {
  idEmpresa?: number;
  nome?: string;
  nomeFantasia?: string;
  documento?: string;
  telefone?: string;
  email?: string;
  nomeResponsavel?: string;
  nomeResponsavelFinanceiro?: string;
  telefoneFinanceiro?: string;
  emailFinanceiro?: string;
}

export interface Fatura {
  idFatura: number;
  nomeEmpresa: string;
  valorTotal: string;
  valorPago?: string;
  dataVencimento: string;
  status: string;
  desconto?: number;
  anotacoes?: string;
  ordensDeServico?: OrdemDeServico[];
  empresa?: EmpresaFatura;
}
export interface CriarFaturaPayload {
  idEmpresa: number;
  dataInicio: string;
  dataFim: string;
}
export interface BuscarFaturasPayload {
  idEmpresa?: number;
  status?: string[];
  competencia?: string; // Formato: MM/YYYY (ex: 11/2025)
}

export interface DetalhamentoImpressaoItem {
  idTrabalho: number;
  dataConclusao: string;
  nomePaciente: string;
  descricao: string;
  statusTrabalho: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  elementosNomes?: string; // Elementos dentais formatados como string (apenas para serviços)
}

export interface DetalhamentoImpressaoResponse {
  nomeEmpresa: string;
  nomeFantasia?: string;
  cnpj?: string;
  contato?: string;
  telefone?: string;
  contatoRestante?: string;
  telefoneWhatsApp?: string;
  contatoFinanceiro?: {
    nome?: string;
    telefone?: string;
    email?: string;
    telefoneWhatsApp?: string;
  };
  dataReferencia: string;
  servicos: DetalhamentoImpressaoItem[];
  componentes: DetalhamentoImpressaoItem[];
  /**
   * Componentes com devolução pendente (status DEVOLUCAO_SOLICITADA no detalhamento).
   * Não repetem em `componentes` — aparecem só nesta lista.
   */
  componentesPendentesDevolucao?: DetalhamentoImpressaoItem[];
  valorTotalServicos: number;
  valorTotalComponentes: number;
  valorTotalBruto: number;
  valorTotalGeral: number;
  valorPago: number;
  valorPendente: number;
  desconto?: number;
  descontoDevolucao?: number;
  devolucoesComponentes?: {
    idComponente: number;
    nomeComponente: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    idPaciente?: number;
    nomePaciente?: string | null;
  }[];
}

export interface ImpressaoCompetenciaResponse {
  competencia: string;
  faturas: DetalhamentoImpressaoResponse[]; // Array de faturas no mesmo formato de detalhamento-impressao
  totalizadores: {
    totalFaturas: number;
    valorTotalGeral: number;
    valorTotalPago: number;
    valorTotalPendente: number;
  };
}

export interface FaturaPendenteItem {
  idFatura: number;
  dataInicio: string;
  dataFim: string;
  dataVencimento: string;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
}

export interface EmpresaFaturasPendentes {
  idEmpresa: number;
  nomeEmpresa: string;
  contato: string;
  totalPendenteEmpresa: number;
  faturas: FaturaPendenteItem[];
}

export interface RelatorioFaturasPendentesResponse {
  empresas: EmpresaFaturasPendentes[];
  totalGeralPendente: number;
}

export interface MoverOrdemServicoPayload {
  idOrdemServico: number;
  idFaturaDestino: null;
  idEmpresa: number;
}

export interface LancarValorFaturaDto {
  valor: number;
  idConta: number;
  dataPagamento?: string;
  meioPagamento?: string;
  parcelas?: {
      valor: number;
      dataVencimento: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class FaturaService {
  private apiUrl = `${env.BASE_URL}/financeiro/faturas`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const currentUserString = localStorage.getItem("currentUser");
    if (currentUserString) {
      const currentUser = JSON.parse(currentUserString);
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
      });
    }
    return new HttpHeaders();
  }

  /**
   * Busca faturas com base nos filtros fornecidos.
   * Corresponde a: GET /financeiro/faturas
   */
  buscarFaturas(payload?: BuscarFaturasPayload): Observable<Fatura[]> {
    let params = new HttpParams();
    if (payload) {
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Trata arrays (status) como múltiplos parâmetros
          if (Array.isArray(value)) {
            value.forEach(item => {
              params = params.append(key, String(item));
            });
          } else {
            params = params.set(key, String(value));
          }
        }
      });
    }
    return this.http.get<Fatura[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Busca uma fatura específica pelo seu ID.
   * Corresponde a: GET /financeiro/faturas/:idFatura
   */
  buscarFaturaPorId(idFatura: number, idEmpresa?: number): Observable<Fatura> {
    const params = idEmpresa ? new HttpParams().set('idEmpresa', idEmpresa.toString()) : undefined;
    return this.http.get<Fatura>(`${this.apiUrl}/${idFatura}`, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Gera faturas recorrentes.
   * Corresponde a: POST /financeiro/faturas/gerar-recorrentes
   */
  gerarFaturasRecorrentes(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/gerar-recorrentes`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Fecha uma fatura específica.
   * Corresponde a: POST /financeiro/faturas/:idFatura/fechar
   */
  fecharFatura(idFatura: number, idEmpresa?: number): Observable<any> {
    const params = idEmpresa ? new HttpParams().set('idEmpresa', idEmpresa.toString()) : undefined;
    return this.http.post<any>(`${this.apiUrl}/${idFatura}/fechar`, {}, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Deleta um item de uma fatura específica.
   * Corresponde a: DELETE /financeiro/faturas/:idFatura/itens/:idItem
   */
  deletarItemFatura(idFatura: number, idItem: number, idEmpresa?: number): Observable<any> {
    const params = idEmpresa ? new HttpParams().set('idEmpresa', idEmpresa.toString()) : undefined;
    return this.http.delete<any>(`${this.apiUrl}/${idFatura}/itens/${idItem}`, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Cria uma nova fatura com base nos parâmetros.
   * Corresponde a: POST /financeiro/faturas
   */
  criarFatura(payload: CriarFaturaPayload): Observable<Fatura> {
    return this.http.post<Fatura>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Realiza a baixa de pagamento de itens de uma fatura.
   * Corresponde a: POST /financeiro/faturas/pagar-itens
   */
  pagarItensFatura(payload: PagarItensPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pagar-itens`, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Solicita o recálculo de uma fatura.
   * Corresponde a: POST /financeiro/faturas/:id/recalcular
   */
  recalcular(idFatura: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${idFatura}/recalcular`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Move uma ordem de serviço para a próxima fatura da empresa.
   * Corresponde a: PUT /financeiro/faturas/mover-ordem-servico
   */
  moverOrdemServico(payload: MoverOrdemServicoPayload): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/mover-ordem-servico`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Busca os dados de detalhamento para impressão da fatura.
   * Corresponde a: GET /financeiro/faturas/:id/detalhamento-impressao
   */
  buscarDetalhamentoImpressao(idFatura: number): Observable<DetalhamentoImpressaoResponse> {
    return this.http.get<DetalhamentoImpressaoResponse>(
      `${this.apiUrl}/${idFatura}/detalhamento-impressao`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Busca todas as faturas de uma competência para impressão em lote.
   * Corresponde a: GET /financeiro/faturas/impressao/competencia/:competencia
   * @param competencia Formato MM/YYYY (ex: "11/2025") - será convertido para MM-YYYY na URL
   * @param idEmpresa ID da empresa (opcional)
   */
  buscarFaturasImpressaoPorCompetencia(competencia: string, idEmpresa?: number): Observable<ImpressaoCompetenciaResponse> {
    let params = new HttpParams();
    if (idEmpresa) {
      params = params.set('idEmpresa', idEmpresa.toString());
    }

    // A URL espera o formato MM-YYYY com hífen
    // Exemplo: /financeiro/faturas/impressao/competencia/11-2025
    const competenciaUrl = competencia.replace('/', '-'); // Converte MM/YYYY para MM-YYYY

    return this.http.get<ImpressaoCompetenciaResponse>(
      `${this.apiUrl}/impressao/competencia/${competenciaUrl}`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * Busca o relatório de faturas pendentes (abertas, parcialmente pagas ou com componentes para reposição futura),
   * agrupadas por empresa, com totais por empresa e total geral.
   * Corresponde a: GET /financeiro/faturas/relatorio-faturas-pendentes
   */
  buscarRelatorioFaturasPendentes(): Observable<RelatorioFaturasPendentesResponse> {
    return this.http.get<RelatorioFaturasPendentesResponse>(
      `${this.apiUrl}/relatorio-faturas-pendentes`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Atualiza o desconto de uma fatura.
   * Corresponde a: PUT /financeiro/faturas/:idFatura/desconto
   * @param idFatura ID da fatura
   * @param desconto Valor do desconto (não pode ser negativo, mínimo: 0)
   */
  atualizarDesconto(idFatura: number, desconto: number): Observable<Fatura> {
    return this.http.put<Fatura>(
      `${this.apiUrl}/${idFatura}/desconto`,
      { desconto },
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Lança um valor diretamente na fatura como movimentação financeira já paga.
   * Corresponde a: POST /financeiro/faturas/:idFatura/lancar-valor
   * @param idFatura ID da fatura
   * @param dto DTO com valor, conta, data de pagamento e meio de pagamento (opcional)
   */
  lancarValorFatura(idFatura: number, dto: LancarValorFaturaDto): Observable<Fatura> {
    return this.http.post<Fatura>(
      `${this.apiUrl}/${idFatura}/lancar-valor`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Atualiza as anotações de uma fatura.
   * Corresponde a: PUT /financeiro/faturas/:idFatura/anotacoes
   * @param idFatura ID da fatura
   * @param anotacoes Texto das anotações (pode ser null ou string vazia)
   */
  atualizarAnotacoes(idFatura: number, anotacoes: string | null): Observable<Fatura> {
    return this.http.put<Fatura>(
      `${this.apiUrl}/${idFatura}/anotacoes`,
      { anotacoes: anotacoes || null },
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Reabre uma fatura paga ou parcialmente paga, desfazendo os lançamentos no financeiro.
   * Corresponde a: POST /financeiro/faturas/:idFatura/reabrir
   */
  reabrirFatura(idFatura: number): Observable<Fatura> {
    return this.http.post<Fatura>(
      `${this.apiUrl}/${idFatura}/reabrir`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  dividirFatura(idFatura: number, payload: { descricao: string; idsOrdemServico: number[] }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${idFatura}/dividir`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  buscarDevolucoesComponentes(idFatura: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/${idFatura}/devolucoes-componentes`,
      { headers: this.getAuthHeaders() }
    );
  }

  salvarDevolucoesComponentes(idFatura: number, items: { idComponente: number; quantidade: number }[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${idFatura}/devolucoes-componentes`,
      items,
      { headers: this.getAuthHeaders() }
    );
  }
}
