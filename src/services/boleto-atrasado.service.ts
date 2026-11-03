import Axios from "axios";
import { env } from "./envfile";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";

const getAuthToken = () => {
  const currentUserString = localStorage.getItem("currentUser");
  if (currentUserString) {
    const currentUser = JSON.parse(currentUserString);
    return currentUser.token;
  }
  return null;
};

export interface BoletoAtrasado {
  idParcela: number;
  idLancamento: number;
  descricao: string;
  tipo: string;
  valor: number;
  valorPago: number;
  valorRestante: number;
  dataVencimento: string;
  diasAtraso: number;
  numeroBoleto?: string;
  codigoBarras?: string;
  juros?: number;
  multa?: number;
  valorTotalComJuros?: number;
  gerarJuros?: boolean;
  nomeEmpresa?: string;
}

export const listarBoletosAtrasados = async (idEmpresa?: number, tipo?: string): Promise<{ data: BoletoAtrasado[] }> => {
  const options: any = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/boletos-atrasados`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  options.params = {};
  if (idEmpresa) {
    options.params.idEmpresa = idEmpresa;
  }
  if (tipo) {
    options.params.tipo = tipo;
  }

  return await Axios(options);
};

export const obterResumoBoleto = async (idParcela: number): Promise<{ data: BoletoAtrasado }> => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/boletos-atrasados/${idParcela}/resumo`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

