import Axios from 'axios';
import { env } from './envfile';

const getAuthToken = () => {
  const currentUserString = localStorage.getItem('currentUser');
  if (currentUserString) {
    const currentUser = JSON.parse(currentUserString);
    return currentUser.token;
  }
  return null;
};

export interface FornecedorFinanceiro {
  idFornecedor: number;
  cnpj?: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  ativo: boolean;
  idCategoria?: number | null;
  categoria?: { idCategoria: number; nome: string };
  dataInclusao?: string;
  dataAlteracao?: string;
}

export interface CreateFornecedorFinanceiroDto {
  cnpj?: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  telefone?: string;
  idCategoria?: number | null;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  ativo?: boolean;
}

export const listarFornecedores = async (ativo?: boolean) => {
  const params = ativo !== undefined ? { ativo: String(ativo) } : {};
  const { data } = await Axios.get<FornecedorFinanceiro[]>(`${env.BASE_URL}/financeiro/fornecedores`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    params,
  });
  return data;
};

export const buscarFornecedorPorId = async (id: number) => {
  const { data } = await Axios.get<FornecedorFinanceiro>(`${env.BASE_URL}/financeiro/fornecedores/${id}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  return data;
};

export const criarFornecedor = async (dto: CreateFornecedorFinanceiroDto) => {
  const { data } = await Axios.post<FornecedorFinanceiro>(`${env.BASE_URL}/financeiro/fornecedores`, dto, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  return data;
};

export const atualizarFornecedor = async (id: number, dto: Partial<CreateFornecedorFinanceiroDto>) => {
  const { data } = await Axios.put<FornecedorFinanceiro>(`${env.BASE_URL}/financeiro/fornecedores/${id}`, dto, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  return data;
};

export const excluirFornecedor = async (id: number) => {
  await Axios.delete(`${env.BASE_URL}/financeiro/fornecedores/${id}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
};
