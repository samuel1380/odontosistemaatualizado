import Axios from "axios";
import { env } from "./envfile";

const getAuthToken = () => {
  const currentUserString = localStorage.getItem("currentUser");
  if (currentUserString) {
    const currentUser = JSON.parse(currentUserString);
    return currentUser.token;
  }
  return null;
};

export interface ArquivoOfx {
  idArquivoOfx: number;
  idConta: number;
  nomeArquivo: string;
  dataImportacao: string;
  dataInicio: string;
  dataFim: string;
  saldoInicial: number;
  saldoFinal: number;
  totalTransacoes: number;
  idUsuarioImportacao: number;
  conta?: any;
  transacoes?: TransacaoOfx[];
}

export interface TransacaoOfx {
  idTransacaoOfx: number;
  idConta: number;
  idArquivoOfx: number;
  fitId: string;
  tipo: 'CREDITO' | 'DEBITO';
  valor: number;
  dataTransacao: string;
  dataPostagem?: string;
  descricao?: string;
  numeroCheque?: string;
  statusConciliacao: 'PENDENTE' | 'CONCILIADO' | 'IGNORADO';
  dataConciliacao?: string;
  observacoes?: string;
  conta?: any;
  arquivoOfx?: ArquivoOfx;
  conciliacao?: ConciliacaoTransacao;
}

export interface ConciliacaoTransacao {
  idConciliacao: number;
  idTransacaoOfx: number;
  idMovimentacao?: number;
  idAporte?: number;
  idRetirada?: number;
  tipoVinculo: 'MOVIMENTACAO' | 'APORTE' | 'RETIRADA';
  dataConciliacao: string;
  idUsuarioConciliacao: number;
  observacoes?: string;
  transacaoOfx?: TransacaoOfx;
  movimentacao?: any;
  aporte?: any;
  retirada?: any;
}

export interface MovimentacaoDisponivel {
  idMovimentacao: number;
  idConta: number;
  tipo: 'CREDITO' | 'DEBITO' | 'CREDITO_INTERNO';
  valor: number;
  descricao: string;
  dataMovimentacao: string;
  idParcelaOrigem?: number;
  idAgrupadorTransferencia?: string;
  conta?: any;
}

export interface VincularConciliacaoDto {
  idTransacaoOfx: number;
  tipoVinculo: 'MOVIMENTACAO' | 'APORTE' | 'RETIRADA';
  idMovimentacao?: number;
  idAporte?: number;
  idRetirada?: number;
  observacoes?: string;
}

export interface FiltroConciliacaoDto {
  idConta?: number;
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'CREDITO' | 'DEBITO';
  statusConciliacao?: 'PENDENTE' | 'CONCILIADO' | 'IGNORADO';
  valorMin?: number;
  valorMax?: number;
}

export interface Retirada {
  idRetirada: number;
  idLancamento: number;
  idSocio?: number;
  dataRetirada: string;
  valor: number;
  tipo: 'RETIRADA_CAPITAL' | 'DISTRIBUICAO_LUCROS' | 'OUTROS';
  observacoes?: string;
  lancamento?: any;
}

export interface CreateRetiradaDto {
  idSocio?: number;
  dataRetirada: string;
  valor: number;
  tipo: 'RETIRADA_CAPITAL' | 'DISTRIBUICAO_LUCROS' | 'OUTROS';
  observacoes?: string;
  idCategoria?: number;
  idConta?: number;
  meioPagamento?: string;
}

// Importação de arquivos OFX
export const importarArquivoOfx = async (file: File, idConta: number) => {
  const formData = new FormData();
  formData.append('arquivo', file);
  formData.append('idConta', idConta.toString());

  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/ofx/importar`,
    data: formData,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const listarArquivosOfx = async (idConta?: number) => {
  const params: any = {};
  if (idConta) params.idConta = idConta;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/ofx/arquivos`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarArquivoOfxPorId = async (id: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/ofx/arquivos/${id}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const excluirArquivoOfx = async (id: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/ofx/arquivos/${id}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Conciliação
export const listarTransacoesNaoConciliadas = async (filtros: FiltroConciliacaoDto) => {
  const params: any = {};
  if (filtros.idConta) params.idConta = filtros.idConta;
  if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
  if (filtros.dataFim) params.dataFim = filtros.dataFim;
  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.statusConciliacao) params.statusConciliacao = filtros.statusConciliacao;
  if (filtros.valorMin !== undefined) params.valorMin = filtros.valorMin;
  if (filtros.valorMax !== undefined) params.valorMax = filtros.valorMax;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/conciliacao/transacoes`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarMovimentacoesDisponiveis = async (filtros: FiltroConciliacaoDto) => {
  const params: any = {};
  if (filtros.idConta) params.idConta = filtros.idConta;
  if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
  if (filtros.dataFim) params.dataFim = filtros.dataFim;
  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.valorMin !== undefined) params.valorMin = filtros.valorMin;
  if (filtros.valorMax !== undefined) params.valorMax = filtros.valorMax;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/conciliacao/disponiveis`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const vincularConciliacao = async (dto: VincularConciliacaoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/conciliacao/vincular`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const desfazerConciliacao = async (idConciliacao: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/conciliacao/${idConciliacao}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const ignorarTransacao = async (idTransacaoOfx: number) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/conciliacao/${idTransacaoOfx}/ignorar`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarSugestoes = async (idTransacaoOfx: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/conciliacao/sugestoes/${idTransacaoOfx}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Retiradas
export const registrarRetirada = async (dto: CreateRetiradaDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/retirada`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarRetiradas = async (idSocio?: number, dataInicio?: string, dataFim?: string, tipo?: string) => {
  const params: any = {};
  if (idSocio) params.idSocio = idSocio;
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;
  if (tipo) params.tipo = tipo;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/retiradas`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarRetiradaPorId = async (id: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/retiradas/${id}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};
