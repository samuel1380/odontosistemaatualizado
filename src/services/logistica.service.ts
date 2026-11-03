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

export interface FornecedorLogistica {
  idFornecedorLogistica: number;
  nome: string;
  tipo: string;
  contato?: string;
  telefone?: string;
  email?: string;
  idEmpresa?: number;
  ativo: boolean;
}

export interface Entrega {
  idEntrega: number;
  idLancamento?: number;
  idFornecedorLogistica: number;
  dataEntrega: string;
  origem: string;
  destino: string;
  peso?: number;
  valorFrete: number;
  status: string;
  observacoes?: string;
  fornecedorLogistica?: FornecedorLogistica;
}

export interface CreateFornecedorLogisticaDto {
  nome: string;
  tipo: string;
  contato?: string;
  telefone?: string;
  email?: string;
  idEmpresa?: number;
}

export interface CreateEntregaDto {
  idFornecedorLogistica: number;
  dataEntrega: string;
  origem: string;
  destino: string;
  peso?: number;
  valorFrete: number;
  observacoes?: string;
  idCategoria?: number;
  idConta?: number;
  meioPagamento?: string;
}

// Fornecedores
export const criarFornecedor = async (dto: CreateFornecedorLogisticaDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/logistica/fornecedores`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarFornecedores = async (idEmpresa?: number) => {
  const options: any = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/logistica/fornecedores`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  if (idEmpresa) {
    options.params = { idEmpresa };
  }

  return await Axios(options);
};

export const buscarFornecedorPorId = async (idFornecedorLogistica: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/logistica/fornecedores/${idFornecedorLogistica}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarFornecedor = async (idFornecedorLogistica: number, dto: Partial<CreateFornecedorLogisticaDto>) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/logistica/fornecedores/${idFornecedorLogistica}`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const excluirFornecedor = async (idFornecedorLogistica: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/logistica/fornecedores/${idFornecedorLogistica}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Entregas
export const registrarEntrega = async (dto: CreateEntregaDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/logistica/entrega`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarEntregas = async (idFornecedorLogistica?: number, dataInicio?: string, dataFim?: string, status?: string) => {
  const params: any = {};
  if (idFornecedorLogistica) params.idFornecedorLogistica = idFornecedorLogistica;
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;
  if (status) params.status = status;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/logistica/entregas`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarStatusEntrega = async (idEntrega: number, status: string) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/logistica/entregas/${idEntrega}/status`,
    data: { status },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

