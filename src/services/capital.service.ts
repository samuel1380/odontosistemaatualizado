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

export interface Aporte {
  idAporte: number;
  idLancamento: number;
  idSocio?: number;
  dataAporte: string;
  valor: number;
  tipo: string;
  observacoes?: string;
  lancamento?: any;
  socio?: Socio;
}

export interface Emprestimo {
  idEmprestimo: number;
  idLancamento: number;
  tipo: string;
  valorPrincipal: number;
  /** Saldo devedor restante (empréstimos recebidos). */
  saldoRestante?: number;
  taxaJuros?: number;
  dataContratacao: string;
  dataVencimento?: string;
  status: string;
  idCredorDevedor?: number;
  observacoes?: string;
  lancamento?: any;
  credor?: Credor;
}

export interface EmprestimoMovimentacaoPagamento {
  idMovimentacao: number;
  idEmprestimo: number;
  idLancamento?: number;
  valor: number;
  dataMovimentacao: string;
  tipoMovimentacao?: 'JUROS' | 'PAGAMENTO' | 'ACRESCIMO';
  observacoes?: string;
  saldoAposMovimentacao?: number;
  lancamento?: {
    descricao: string;
    idCategoria?: number;
  };
}

export interface CreateAporteDto {
  idSocio?: number;
  dataAporte: string;
  valor: number;
  tipo: string;
  observacoes?: string;
  idCategoria?: number;
  idConta?: number;
  meioPagamento?: string;
}

export interface CreateEmprestimoDto {
  tipo: string;
  valorPrincipal: number;
  taxaJuros?: number;
  dataContratacao: string;
  dataVencimento?: string;
  idCredorDevedor?: number;
  observacoes?: string;
  idCategoria?: number;
  idConta?: number;
  meioPagamento?: string;
}

export interface CreateJurosEmprestimoDto {
  valor: number;
  dataCompetencia: string;
  idCategoria?: number;
  idConta?: number;
  observacoes?: string;
}

export interface CreatePagamentoEmprestimoDto {
  valor: number;
  dataPagamento: string;
  idConta: number;
  idCategoria?: number;
  meioPagamento?: string;
  observacoes?: string;
}

// Aportes
export const registrarAporte = async (dto: CreateAporteDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/aporte`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarAportes = async (idSocio?: number, dataInicio?: string, dataFim?: string, tipo?: string) => {
  const params: any = {};
  if (idSocio) params.idSocio = idSocio;
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;
  if (tipo) params.tipo = tipo;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/aportes`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Empréstimos
export const registrarEmprestimo = async (dto: CreateEmprestimoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/emprestimo`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarEmprestimos = async (tipo?: string, status?: string, dataInicio?: string, dataFim?: string) => {
  const params: any = {};
  if (tipo) params.tipo = tipo;
  if (status) params.status = status;
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarStatusEmprestimo = async (idEmprestimo: number, status: string) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/status`,
    data: { status },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarMovimentacoesPagamentoEmprestimo = async (idEmprestimo: number) => {
  return await Axios<EmprestimoMovimentacaoPagamento[]>({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/movimentacoes-pagamento`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const registrarJurosEmprestimo = async (idEmprestimo: number, dto: CreateJurosEmprestimoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/juros`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const registrarAcrescimoEmprestimo = async (idEmprestimo: number, dto: CreateJurosEmprestimoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/acrescimo`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const registrarPagamentoEmprestimo = async (idEmprestimo: number, dto: CreatePagamentoEmprestimoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/pagamento`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const recalcularSaldoEmprestimo = async (idEmprestimo: number) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/emprestimos/${idEmprestimo}/recalcular`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Sócios
export interface Socio {
  idSocio: number;
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  idEmpresa?: number;
  idConta?: number;
  ativo: boolean;
  conta?: any;
}

export interface CreateSocioDto {
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  idEmpresa?: number;
}

export const criarSocio = async (dto: CreateSocioDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/socios`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarSocios = async (idEmpresa?: number) => {
  const params: any = {};
  if (idEmpresa) params.idEmpresa = idEmpresa;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/socios`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarSocioPorId = async (idSocio: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/socios/${idSocio}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarSocio = async (idSocio: number, dto: Partial<CreateSocioDto>) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/capital/socios/${idSocio}`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const excluirSocio = async (idSocio: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/capital/socios/${idSocio}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Credores
export interface Credor {
  idCredor: number;
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  idEmpresa?: number;
  idConta?: number;
  ativo: boolean;
  conta?: any;
}

export interface CreateCredorDto {
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  idEmpresa?: number;
}

export const criarCredor = async (dto: CreateCredorDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/capital/credores`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarCredores = async (idEmpresa?: number) => {
  const params: any = {};
  if (idEmpresa) params.idEmpresa = idEmpresa;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/credores`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarCredorPorId = async (idCredor: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/capital/credores/${idCredor}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarCredor = async (idCredor: number, dto: Partial<CreateCredorDto>) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/capital/credores/${idCredor}`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const excluirCredor = async (idCredor: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/capital/credores/${idCredor}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

