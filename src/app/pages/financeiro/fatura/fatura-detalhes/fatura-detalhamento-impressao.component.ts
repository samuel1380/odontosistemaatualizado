import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DetalhamentoImpressaoItem,
  DetalhamentoImpressaoResponse,
  FaturaService
} from 'src/services/financeiro.fatura.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

(pdfMake as any).vfs = pdfFonts;

export interface FaturaDetalhamentoImpressaoData {
  idFatura?: number;
  detalhamento?: DetalhamentoImpressaoResponse; // Dados já carregados (opcional)
}

@Component({
  selector: 'app-fatura-detalhamento-impressao',
  templateUrl: './fatura-detalhamento-impressao.component.html',
  styleUrls: ['./fatura-detalhamento-impressao.component.sass']
})
export class FaturaDetalhamentoImpressaoComponent implements OnInit {
  detalhamento?: DetalhamentoImpressaoResponse;
  carregando = true;
  erro?: string;

  /** Contagem da fatura (uma empresa): solicitações e unidades em devolução pendente. */
  resumoDevolucaoFatura: { totalSolicitacoes: number; totalQuantidade: number } | null = null;
  /** Somatória por tipo de componente (sem repetir pacientes). */
  somatorioDevolucaoPorComponente: { descricaoComponente: string; quantidadeTotal: number }[] = [];

  constructor(
    private dialogRef: MatDialogRef<FaturaDetalhamentoImpressaoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FaturaDetalhamentoImpressaoData,
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Se os dados já foram passados, usa diretamente
    if (this.data.detalhamento) {
      this.detalhamento = this.data.detalhamento;
      this.atualizarAgregadosDevolucao();
      this.carregando = false;
    } else if (this.data.idFatura) {
      // Caso contrário, busca pelo ID
      this.carregarDetalhamento();
    } else {
      this.erro = 'Dados da fatura não fornecidos.';
      this.carregando = false;
    }
  }

  carregarDetalhamento(): void {
    if (!this.data.idFatura) {
      this.erro = 'ID da fatura não fornecido.';
      this.carregando = false;
      return;
    }

    this.carregando = true;
    this.erro = undefined;

    this.faturaService.buscarDetalhamentoImpressao(this.data.idFatura).subscribe({
      next: (dados) => {
        this.detalhamento = dados;
        this.atualizarAgregadosDevolucao();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar detalhamento de impressão', err);
        const mensagem = err?.error?.resposta || 'Falha ao carregar o detalhamento. Tente novamente.';
        this.erro = mensagem;
        this.carregando = false;
        this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
      }
    });
  }

  /** Link para abrir conversa no WhatsApp Desktop. */
  get linkWhatsApp(): string {
    const num = this.detalhamento?.telefoneWhatsApp;
    if (!num) return '';
    let digits = String(num).replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) digits = '55' + digits;
    return digits ? `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0` : '';
  }

  /** Gera link WhatsApp Desktop a partir de um número (para contato financeiro etc.). */
  getLinkWhatsApp(telefone: string): string {
    if (!telefone) return '';
    let digits = String(telefone).replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) digits = '55' + digits;
    return digits ? `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0` : '';
  }

  get temServicos(): boolean {
    return (this.detalhamento?.servicos?.length || 0) > 0;
  }

  get temComponentes(): boolean {
    return (this.detalhamento?.componentes?.length || 0) > 0;
  }

  /** Itens de componente com devolução pendente (prioriza campo retornado pela API). */
  get componentesAguardandoDevolucao(): DetalhamentoImpressaoItem[] {
    const daApi = this.detalhamento?.componentesPendentesDevolucao;
    if (daApi != null) {
      return daApi;
    }
    return FaturaDetalhamentoImpressaoComponent.filtrarComponentesAguardandoDevolucao(
      this.detalhamento?.componentes
    );
  }

  get temComponentesAguardandoDevolucao(): boolean {
    return this.componentesAguardandoDevolucao.length > 0;
  }

  get temSomatorioDevolucao(): boolean {
    return (this.somatorioDevolucaoPorComponente?.length ?? 0) > 0 && this.resumoDevolucaoFatura != null;
  }

  trackBySomatorio(_i: number, s: { descricaoComponente: string; quantidadeTotal: number }): string {
    return s.descricaoComponente;
  }

  private atualizarAgregadosDevolucao(): void {
    if (!this.detalhamento) {
      this.resumoDevolucaoFatura = null;
      this.somatorioDevolucaoPorComponente = [];
      return;
    }
    const aguardando =
      this.detalhamento.componentesPendentesDevolucao ??
      FaturaDetalhamentoImpressaoComponent.filtrarComponentesAguardandoDevolucao(
        this.detalhamento.componentes,
      );
    this.resumoDevolucaoFatura =
      aguardando.length > 0
        ? FaturaDetalhamentoImpressaoComponent.resumoContabilizacaoDevolucaoFatura(aguardando)
        : null;
    this.somatorioDevolucaoPorComponente =
      aguardando.length > 0
        ? FaturaDetalhamentoImpressaoComponent.somarComponentesDevolucaoPorTipo(aguardando)
        : [];
  }

  /** Nome base do componente (remove sufixos de devolução da descrição exibida). */
  static descricaoBaseDevolucao(descricao: string): string {
    if (!descricao) {
      return '';
    }
    const partes = descricao.split(' — ');
    return (partes[0] || descricao).trim();
  }

  static resumoContabilizacaoDevolucaoFatura(
    itens: DetalhamentoImpressaoItem[],
  ): { totalSolicitacoes: number; totalQuantidade: number } {
    const totalSolicitacoes = itens.length;
    const totalQuantidade = itens.reduce((acc, c) => acc + (Number(c.quantidade) || 0), 0);
    return { totalSolicitacoes, totalQuantidade };
  }

  static somarComponentesDevolucaoPorTipo(
    itens: DetalhamentoImpressaoItem[],
  ): { descricaoComponente: string; quantidadeTotal: number }[] {
    const mapa = new Map<string, { nome: string; quantidadeTotal: number }>();
    for (const c of itens) {
      const nome = FaturaDetalhamentoImpressaoComponent.descricaoBaseDevolucao(c.descricao || '');
      const chave = nome.toLowerCase() || (c.descricao || '').toLowerCase();
      const qtd = Number(c.quantidade) || 0;
      if (!mapa.has(chave)) {
        mapa.set(chave, { nome: nome || c.descricao || '—', quantidadeTotal: 0 });
      }
      const agg = mapa.get(chave)!;
      agg.quantidadeTotal += qtd;
    }
    return [...mapa.values()]
      .map((v) => ({ descricaoComponente: v.nome, quantidadeTotal: v.quantidadeTotal }))
      .sort((a, b) =>
        a.descricaoComponente.localeCompare(b.descricaoComponente, 'pt-BR', { sensitivity: 'base' }),
      );
  }

  static filtrarComponentesAguardandoDevolucao(
    componentes: DetalhamentoImpressaoItem[] | undefined
  ): DetalhamentoImpressaoItem[] {
    return (componentes || []).filter(
      (c) => (c.statusTrabalho || '').toUpperCase() === 'DEVOLUCAO_SOLICITADA'
    );
  }

  imprimir(): void {
    if (!this.detalhamento) {
      this.snackBar.open('Detalhamento ainda não carregado.', 'Fechar', { duration: 3000 });
      return;
    }

    FaturaDetalhamentoImpressaoComponent.gerarPdf(this.detalhamento, this.data.idFatura);
  }

  /**
   * Método estático para gerar PDF de uma fatura
   * Pode ser chamado externamente sem precisar instanciar o componente
   * @param detalhamento Dados da fatura
   * @param idFatura ID da fatura (opcional)
   * @param competencia Competência no formato MM/YYYY (opcional, para nome do arquivo)
   */
  static gerarPdf(detalhamento: DetalhamentoImpressaoResponse, idFatura?: number, competencia?: string): void {
    const servicosBody = [
      ['ID Trabalho', 'Data Conclusão', 'Paciente', 'Descrição', 'Status', 'Qtd.', 'Valor Unit.', 'Valor Total'],
      ...(detalhamento.servicos || []).map(servico => {
        const descricaoCompleta = servico.elementosNomes
          ? `${servico.descricao} | ${servico.elementosNomes}`
          : servico.descricao;
        return [
          servico.idTrabalho,
          FaturaDetalhamentoImpressaoComponent.formatarData(servico.dataConclusao),
          servico.nomePaciente,
          descricaoCompleta,
          FaturaDetalhamentoImpressaoComponent.obterCelulaStatusPdf(servico.statusTrabalho),
          servico.quantidade,
          FaturaDetalhamentoImpressaoComponent.formatarMoeda(servico.valorUnitario),
          FaturaDetalhamentoImpressaoComponent.formatarMoeda(servico.valorTotal)
        ];
      })
    ];

    const componentesBody = [
      ['ID Trabalho', 'Data Conclusão', 'Paciente', 'Descrição', 'Status', 'Qtd.', 'Valor Unit.', 'Valor Total'],
      ...(detalhamento.componentes || []).map(componente => ([
        componente.idTrabalho,
        FaturaDetalhamentoImpressaoComponent.formatarData(componente.dataConclusao),
        componente.nomePaciente,
        componente.descricao,
        FaturaDetalhamentoImpressaoComponent.obterCelulaStatusPdf(componente.statusTrabalho),
        componente.quantidade,
        FaturaDetalhamentoImpressaoComponent.formatarMoeda(componente.valorUnitario),
        FaturaDetalhamentoImpressaoComponent.formatarMoeda(componente.valorTotal)
      ]))
    ];

    const componentesAguardando =
      detalhamento.componentesPendentesDevolucao ??
      FaturaDetalhamentoImpressaoComponent.filtrarComponentesAguardandoDevolucao(
        detalhamento.componentes
      );
    const temAguardandoDevolucao = componentesAguardando.length > 0;
    const aguardandoDevolucaoBody = [
      ['ID Trabalho', 'Data Conclusão', 'Paciente', 'Descrição', 'Status', 'Qtd.', 'Valor Unit.', 'Valor Total'],
      ...componentesAguardando.map((c) => [
        c.idTrabalho,
        FaturaDetalhamentoImpressaoComponent.formatarData(c.dataConclusao),
        c.nomePaciente,
        c.descricao,
        FaturaDetalhamentoImpressaoComponent.obterCelulaStatusPdf(c.statusTrabalho),
        c.quantidade,
        FaturaDetalhamentoImpressaoComponent.formatarMoeda(c.valorUnitario),
        FaturaDetalhamentoImpressaoComponent.formatarMoeda((Number(c.quantidade) || 0) * (Number(c.valorUnitario) || 0))
      ])
    ];

    const temServicos = (detalhamento.servicos?.length || 0) > 0;
    const temComponentes = (detalhamento.componentes?.length || 0) > 0;

    const devolucoesComponentes = detalhamento.devolucoesComponentes || [];
    const temDevolucoesComponentes = devolucoesComponentes.length > 0;
    const devolucoesComponentesBody = [
      ['Descrição', 'Qtd.', 'Valor Unit.', 'Valor Total'],
      ...devolucoesComponentes.map(d => [
        d.nomePaciente ? `${d.nomeComponente} (Paciente: ${d.nomePaciente})` : d.nomeComponente,
        d.quantidade,
        FaturaDetalhamentoImpressaoComponent.formatarMoeda(d.valorUnitario),
        FaturaDetalhamentoImpressaoComponent.formatarMoeda(d.valorTotal)
      ])
    ];

    const blocoDevolucoesDescontoPdf: any[] = [];
    if (temDevolucoesComponentes) {
      blocoDevolucoesDescontoPdf.push(
        {
          text: 'Componentes Devolvidos (Desconto)',
          style: 'subheader',
          margin: [0, 15, 0, 5],
          color: '#d32f2f'
        },
        {
          text: 'Os componentes físicos listados abaixo foram devolvidos pelo cliente e convertidos em desconto na fatura.',
          fontSize: 9,
          italics: true,
          color: '#424242',
          margin: [0, 0, 0, 8]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: devolucoesComponentesBody
          },
          layout: 'lightHorizontalLines'
        }
      );
    }

    const blocoAguardandoPdf: any[] = [];
    if (temAguardandoDevolucao) {
      blocoAguardandoPdf.push(
        {
          text: 'Componentes para reposição futura',
          style: 'subheader',
          margin: [0, 15, 0, 5],
          color: '#1565c0'
        },
        {
          text: 'Componentes abaixo estão pendentes de devolução e serão destinados à reposição futura após conferência.',
          fontSize: 9,
          italics: true,
          color: '#424242',
          margin: [0, 0, 0, 8]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
            body: aguardandoDevolucaoBody
          },
          layout: 'lightHorizontalLines'
        }
      );

      const resumoDev = FaturaDetalhamentoImpressaoComponent.resumoContabilizacaoDevolucaoFatura(componentesAguardando);
      const somasDev = FaturaDetalhamentoImpressaoComponent.somarComponentesDevolucaoPorTipo(componentesAguardando);
      const nomeEmpresaPdf = detalhamento.nomeFantasia || detalhamento.nomeEmpresa || '—';
      const corpoSomaPdf = [
        ['Componente', 'Qtd. total'],
        ...somasDev.map((s) => [s.descricaoComponente, String(s.quantidadeTotal)])
      ];
      blocoAguardandoPdf.push(
        {
          text: 'Contabilização (reposição pendente de envio)',
          style: 'subheader',
          margin: [0, 14, 0, 5]
        },
        {
          text: `${nomeEmpresaPdf}: ${resumoDev.totalSolicitacoes} solicitação(ões) em aberto | ${resumoDev.totalQuantidade} unidade(s) a devolver`,
          fontSize: 10,
          margin: [0, 0, 0, 8]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 80],
            body: corpoSomaPdf
          },
          layout: 'lightHorizontalLines'
        }
      );
    }

    const docDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: `Detalhamento da Fatura${idFatura ? ` #${idFatura}` : ''}`,
          style: 'header'
        },
        {
          text: detalhamento.nomeFantasia || detalhamento.nomeEmpresa,
          margin: [0, 5, 0, 0] as [number, number, number, number]
        },
        ...(detalhamento.cnpj ? [{ text: `CNPJ: ${detalhamento.cnpj}`, margin: [0, 2, 0, 0] as [number, number, number, number] }] : []),
        ...(detalhamento.contato && detalhamento.contato !== '—' ? [{ text: `Contato: ${detalhamento.contato}`, margin: [0, 2, 0, 0] as [number, number, number, number] }] : []),
        ...(detalhamento.contatoFinanceiro && (detalhamento.contatoFinanceiro.nome || detalhamento.contatoFinanceiro.telefone || detalhamento.contatoFinanceiro.email)
          ? [{
              text: `Contato Financeiro: ${[detalhamento.contatoFinanceiro.nome, detalhamento.contatoFinanceiro.telefone, detalhamento.contatoFinanceiro.email].filter(Boolean).join(' | ')}`,
              margin: [0, 2, 0, 0] as [number, number, number, number]
            }]
          : []),
        {
          text: `Referência: ${FaturaDetalhamentoImpressaoComponent.formatarReferencia(detalhamento.dataReferencia)}`,
          margin: [0, 2, 0, 15] as [number, number, number, number]
        },
        { text: 'Serviços', style: 'subheader', margin: [0, 15, 0, 5] },
        temServicos
          ? {
              table: {
                headerRows: 1,
                widths: ['auto', 'auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
                body: servicosBody
              },
              layout: 'lightHorizontalLines'
            }
          : { text: 'Nenhum serviço encontrado para esta fatura.' },
        { text: 'Componentes', style: 'subheader', margin: [0, 15, 0, 5] },
        temComponentes
          ? {
              table: {
                headerRows: 1,
                widths: ['auto', 'auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
                body: componentesBody
              },
              layout: 'lightHorizontalLines'
            }
          : { text: 'Nenhum componente para pagamento nesta fatura' },
        ...blocoAguardandoPdf,
        ...blocoDevolucoesDescontoPdf,
        {
          text: 'Resumo Financeiro',
          style: 'subheader',
          margin: [0, 20, 0, 10]
        },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                {
                  text: 'Resumo',
                  style: 'tableHeader',
                  fillColor: '#f0f0f0'
                },
                {
                  text: 'Status de Pagamento',
                  style: 'tableHeader',
                  fillColor: '#f0f0f0',
                  colSpan: 2
                },
                {}
              ],
              [
                {
                  stack: [
                    { text: 'Subtotal', bold: true, fontSize: 10, margin: [0, 5, 0, 2] },
                    { text: `Total de Serviços: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorTotalServicos)}`, fontSize: 9, margin: [5, 0, 0, 1] },
                    { text: `Total de Componentes: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorTotalComponentes)}`, fontSize: 9, margin: [5, 0, 0, 3] },
                    
                    { text: 'Descontos', bold: true, fontSize: 10, margin: [0, 5, 0, 2] },
                    ...(detalhamento.desconto && detalhamento.desconto > 0 ? [
                      { text: `Desconto: -${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.desconto)}`, fontSize: 9, color: '#d32f2f', margin: [5, 0, 0, 1] }
                    ] : []),
                    ...(detalhamento.descontoDevolucao && detalhamento.descontoDevolucao > 0 ? [
                      { text: `Desconto por Devolução: -${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.descontoDevolucao)}`, fontSize: 9, color: '#d32f2f', margin: [5, 0, 0, 1] }
                    ] : []),
                    ...((!detalhamento.desconto || detalhamento.desconto <= 0) && (!detalhamento.descontoDevolucao || detalhamento.descontoDevolucao <= 0) ? [
                      { text: 'Nenhum desconto aplicado', fontSize: 9, italics: true, color: '#888888', margin: [5, 0, 0, 1] }
                    ] : []),
                    
                    { text: 'Total', bold: true, fontSize: 10, margin: [0, 5, 0, 2] },
                    { text: `Total Bruto: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorTotalBruto)}`, fontSize: 9, margin: [5, 0, 0, 1] },
                    ...((detalhamento.desconto || 0) + (detalhamento.descontoDevolucao || 0) > 0 ? [
                      { text: `Total Descontos: -${FaturaDetalhamentoImpressaoComponent.formatarMoeda((detalhamento.desconto || 0) + (detalhamento.descontoDevolucao || 0))}`, fontSize: 9, color: '#d32f2f', margin: [5, 0, 0, 1] }
                    ] : []),
                    { text: `Total a pagar: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorTotalGeral)}`, bold: true, fontSize: 11, margin: [5, 2, 0, 5] }
                  ]
                },
                {
                  text: `Valor Pago: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorPago)}`,
                  color: '#2e7d32',
                  bold: true,
                  fontSize: 12,
                  margin: [10, 0, 0, 0]
                },
                {
                  text: `Valor Pendente: ${FaturaDetalhamentoImpressaoComponent.formatarMoeda(detalhamento.valorPendente)}`,
                  color: '#1976d2',
                  bold: true,
                  fontSize: 12,
                  margin: [10, 0, 0, 0]
                }
              ]
            ]
          },
          layout: {
            defaultBorder: true,
            hLineColor: '#cccccc',
            vLineColor: '#cccccc',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5
          },
          margin: [0, 0, 0, 10]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true
        }
      }
    };

    // Gera o nome do arquivo com empresa e competência
    let nomeArquivo = 'Fatura';

    if (detalhamento.nomeEmpresa) {
      // Remove caracteres especiais do nome da empresa para usar no nome do arquivo
      const nomeEmpresaLimpo = detalhamento.nomeEmpresa
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50); // Limita o tamanho
      nomeArquivo += `_${nomeEmpresaLimpo}`;
    }

    if (competencia) {
      // Converte MM/YYYY para MM-YYYY para o nome do arquivo
      const competenciaLimpa = competencia.replace('/', '-');
      nomeArquivo += `_${competenciaLimpa}`;
    }

    if (idFatura) {
      nomeArquivo += `_${idFatura}`;
    }

    nomeArquivo += '.pdf';

    // Gera o PDF e cria download com nome personalizado
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // Usa getDataUrl() para obter o base64 e criar download com nome personalizado
    pdfDoc.getDataUrl((dataUrl: string) => {
      // Converte dataUrl para blob
      const byteCharacters = atob(dataUrl.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Cria um link temporário para download com nome personalizado
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Abre o PDF em nova aba usando o dataUrl
      window.open(dataUrl, '_blank');

      // Limpa a URL após um tempo
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  private formatarMoeda(valor: number): string {
    return FaturaDetalhamentoImpressaoComponent.formatarMoeda(valor);
  }

  private formatarData(isoDate: string): string {
    return FaturaDetalhamentoImpressaoComponent.formatarData(isoDate);
  }

  private formatarReferencia(isoDate: string): string {
    return FaturaDetalhamentoImpressaoComponent.formatarReferencia(isoDate);
  }

  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  static formatarData(isoDate: string): string {
    if (!isoDate) {
      return '-';
    }

    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  static formatarReferencia(isoDate: string): string {
    if (!isoDate) {
      return '-';
    }

    return new Date(isoDate).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }

  obterClassesLinha(status: string | undefined): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'CANCELADO':
        return 'linha-cancelada';
      case 'AGUARDANDO_DEVOLUCAO':
      case 'DEVOLUCAO_SOLICITADA':
        return 'linha-aguardando';
      case 'PAGAMENTO_RECEBIDO':
      case 'PAGO':
        return 'linha-paga';
      default:
        return '';
    }
  }

  obterClassesStatus(status: string | undefined): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'CANCELADO':
        return 'status-cancelado';
      case 'AGUARDANDO_DEVOLUCAO':
      case 'DEVOLUCAO_SOLICITADA':
        return 'status-aguardando';
      case 'PAGAMENTO_RECEBIDO':
      case 'PAGO':
        return 'status-pago';
      default:
        return '';
    }
  }

  textoStatusItem(status: string | undefined): string {
    return FaturaDetalhamentoImpressaoComponent.textoStatusComponenteItem(status);
  }

  private obterCelulaStatusPdf(status: string): any {
    return FaturaDetalhamentoImpressaoComponent.obterCelulaStatusPdf(status);
  }

  static obterCelulaStatusPdf(status: string): any {
    const texto = FaturaDetalhamentoImpressaoComponent.textoStatusComponenteItem(status);
    const classes = FaturaDetalhamentoImpressaoComponent.obterClassesStatus(status);
    const base = { text: texto, color: '#000000' };

    if (classes === 'status-cancelado') {
      return { ...base, color: '#c05050', decoration: 'lineThrough' };
    }

    if (classes === 'status-aguardando') {
      return { ...base, color: '#2e75c9' };
    }

    if (classes === 'status-pago') {
      return { ...base, color: '#2b8a4a' };
    }

    return base;
  }

  /** Rótulo amigável para status de item (especialmente componente de OS) em tela e PDF. */
  static textoStatusComponenteItem(status: string | undefined | null): string {
    if (!status) {
      return '—';
    }
    const u = status.toUpperCase();
    if (u === 'DEVOLUCAO_SOLICITADA' || u === 'AGUARDANDO_DEVOLUCAO') {
      return 'Componentes para reposição futura';
    }
    return status;
  }

  static obterClassesStatus(status: string | undefined): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'CANCELADO':
        return 'status-cancelado';
      case 'AGUARDANDO_DEVOLUCAO':
      case 'DEVOLUCAO_SOLICITADA':
        return 'status-aguardando';
      case 'PAGAMENTO_RECEBIDO':
      case 'PAGO':
        return 'status-pago';
      default:
        return '';
    }
  }
}

