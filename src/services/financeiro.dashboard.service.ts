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

export interface DashboardFinanceiro {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
  dividasPendentes: number;
  receitasPendentes: number;
  movimentacoesRecentes: any[];
}

export interface Divida {
  idLancamento: number;
  descricao: string;
  tipo: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  dataVencimento: string;
  status: string;
}

export interface FluxoCaixa {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export const obterDashboard = async (idEmpresa?: number, mes?: number, ano?: number): Promise<{ data: DashboardFinanceiro }> => {
  const params: any = {};
  if (idEmpresa) params.idEmpresa = idEmpresa;
  if (mes) params.mes = mes;
  if (ano) params.ano = ano;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/dashboard`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

export const listarDividas = async (idEmpresa?: number): Promise<{ data: Divida[] }> => {
  const options: any = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/dividas`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  if (idEmpresa) {
    options.params = { idEmpresa };
  }

  return await Axios(options);
};

export const obterFluxoCaixa = async (idEmpresa?: number, dias: number = 30): Promise<{ data: FluxoCaixa[] }> => {
  const params: any = { dias };
  if (idEmpresa) params.idEmpresa = idEmpresa;

  return await Axios({
    method: "GET",
    url: `${env.BASE_URL}/financeiro/fluxo-caixa-projecao`,
    params,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
};

