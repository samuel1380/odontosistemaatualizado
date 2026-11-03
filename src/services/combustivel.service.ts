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

export interface Veiculo {
  idVeiculo: number;
  nome: string;
  ativo: boolean;
}

export interface Abastecimento {
  idAbastecimento: number;
  idVeiculo: number;
  idLancamento?: number;
  dataAbastecimento: string;
  litros: number;
  valorLitro: number;
  valorTotal: number;
  quilometragem?: number;
  local?: string;
  observacoes?: string;
  veiculo?: Veiculo;
}

export interface CreateVeiculoDto {
  nome: string;
}

export interface CreateAbastecimentoDto {
  idVeiculo: number;
  dataAbastecimento: string;
  litros: number;
  valorLitro: number;
  quilometragem?: number;
  local?: string;
  observacoes?: string;
}

export interface ConsumoVeiculo {
  consumoMedio: number;
  totalLitros: number;
  totalGasto: number;
  totalKm?: number;
}

export interface ConfiguracaoKm {
  idConfiguracaoKm?: number;
  valorPorKm: number;
  dataInclusao?: string;
  dataAlteracao?: string;
}

export interface PagamentoKm {
  idPagamentoKm: number;
  nomePessoa: string;
  quantidadeKm: number;
  valorPorKm: number;
  valorTotal: number;
  dataPagamento: string;
  idLancamento?: number;
  observacoes?: string;
}

export interface CreatePagamentoKmDto {
  nomePessoa: string;
  quantidadeKm: number;
  dataPagamento: string;
  observacoes?: string;
  idCategoria?: number;
  idConta?: number;
  meioPagamento?: string;
}

export interface UpdateConfiguracaoKmDto {
  valorPorKm: number;
}

// Veículos
export const criarVeiculo = async (dto: CreateVeiculoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarVeiculos = async () => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarVeiculoPorId = async (idVeiculo: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos/${idVeiculo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarVeiculo = async (idVeiculo: number, dto: Partial<CreateVeiculoDto>) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos/${idVeiculo}`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const excluirVeiculo = async (idVeiculo: number) => {
  return await Axios({
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos/${idVeiculo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Abastecimentos
export const registrarAbastecimento = async (dto: CreateAbastecimentoDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/combustivel/abastecimento`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarAbastecimentos = async (idVeiculo?: number, dataInicio?: string, dataFim?: string) => {
  const params: any = {};
  if (idVeiculo) params.idVeiculo = idVeiculo;
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/abastecimentos`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const obterConsumoVeiculo = async (idVeiculo: number, dataInicio?: string, dataFim?: string): Promise<{ data: ConsumoVeiculo }> => {
  const params: any = {};
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/veiculos/${idVeiculo}/consumo`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Configuração de KM
export const obterConfiguracaoKm = async () => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/configuracao-km`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const atualizarConfiguracaoKm = async (dto: UpdateConfiguracaoKmDto) => {
  return await Axios({
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/combustivel/configuracao-km`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

// Pagamentos de KM
export const registrarPagamentoKm = async (dto: CreatePagamentoKmDto) => {
  return await Axios({
    method: "POST",
    url: `${env.BASE_URL}/financeiro/combustivel/pagamento-km`,
    data: dto,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarPagamentosKm = async (dataInicio?: string, dataFim?: string) => {
  const params: any = {};
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/pagamentos-km`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const buscarPagamentoKmPorId = async (idPagamentoKm: number) => {
  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/combustivel/pagamentos-km/${idPagamentoKm}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

