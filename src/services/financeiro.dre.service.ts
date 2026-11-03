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

export interface DreParams {
  dataInicio: string;
  dataFim: string;
  regime: "competencia" | "caixa";
  idEmpresa?: number;
}

export interface DreLinha {
  tipo: string;
  idCategoria: number | null;
  nomeCategoria: string;
  idCategoriaPai: number | null;
  nivel: number;
  valoresPorMes: Record<string, number>;
  totalGeral: number;
}

export interface DreResponse {
  meses: string[];
  linhas: DreLinha[];
  totaisReceitaPorMes: Record<string, number>;
  totaisDespesaPorMes: Record<string, number>;
  resultadoPorMes: Record<string, number>;
  totaisReceitaOperacionalPorMes: Record<string, number>;
  totaisDespesaOperacionalPorMes: Record<string, number>;
  totaisDespesaVariavelPorMes: Record<string, number>;
  margemContribuicaoPorMes: Record<string, number>;
  indiceContribuicaoPorMes: Record<string, number>;
  ebitdaPorMes: Record<string, number>;
  ebitdaAbsolutoPorMes: Record<string, number>;
  totaisDepreciacaoAmortizacaoPorMes: Record<string, number>;
  lucroOperacionalAjustadoPorMes?: Record<string, number>;
  ebitdaAjustadoPorMes?: Record<string, number>;
  resultadoOperacionalPorMes: Record<string, number>;
  totaisInvestimentosPorMes: Record<string, number>;
  resultadoPosInvestimentoPorMes: Record<string, number>;
  totaisAportesPorMes: Record<string, number>;
  totaisSaidasFinanciamentoPorMes: Record<string, number>;
  resultadoLiquidoPorMes: Record<string, number>;
  /**
   * Regime de caixa: saldo em aberto (valor - valorPago) por mês de vencimento, só status Vencido.
   * Informativo; não compõe o resultado líquido.
   */
  totaisParcelasVencidasPorMes?: Record<string, number>;
  /** Receita apenas de lançamentos com fatura (vigência ou caixa conforme regime). */
  totaisReceitaFaturasPorMes: Record<string, number>;
  linhaReceitaFaturas: DreLinha;
}

export const buscarDre = async (params: DreParams) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/dre`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    params: {
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      regime: params.regime,
      idEmpresa: params.idEmpresa,
    },
  };

  return await Axios(options);
};
