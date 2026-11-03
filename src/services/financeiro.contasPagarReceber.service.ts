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

export const buscarLancamentos = async (query?: any) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/lancamentos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    },
    params: query
  };

  return await Axios(options);
};

export const cadastrarLancamentos = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/financeiro/lancamentos`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const confirmarPagamento = async (idParcela: number, payload: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/financeiro/parcelas/${idParcela}/pagar`,
    data: payload,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cancelarParcela = async (idParcela: number) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/parcelas/${idParcela}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarLancamentoPorId = async (idLancamento: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/lancamentos/${idLancamento}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const atualizarLancamento = async (idLancamento: number, payload: any) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/financeiro/lancamentos/${idLancamento}`,
    data: payload,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export interface ImportarOfxContasPagarResultado {
  inseridos: number;
  ignoradosDuplicados: number;
  ignoradosSemFitId: number;
  ignoradosValorNaoNegativo: number;
  semFornecedorAutomatico: number;
  classificadosPelaCategoriaDoFornecedor: number;
}

/** Importa OFX para contas a pagar (apenas valores negativos / débitos). */
export interface ImportarCsvHistoricoResultado {
  inseridos: number;
  inseridosCredito: number;
  inseridosDebito: number;
  erros: { linha?: number; mensagem: string }[];
}

/** Importação temporária de lançamentos antigos via CSV. */
export const importarLancamentosCsvHistorico = async (
  file: File,
  idCategoriaReceita?: number,
  idCategoriaDespesa?: number,
  idConta?: number,
) => {
  const formData = new FormData();
  formData.append('arquivo', file);
  if (idCategoriaReceita != null) {
    formData.append('idCategoriaReceita', String(idCategoriaReceita));
  }
  if (idCategoriaDespesa != null) {
    formData.append('idCategoriaDespesa', String(idCategoriaDespesa));
  }
  if (idConta != null && !Number.isNaN(idConta)) {
    formData.append('idConta', String(idConta));
  }
  return await Axios.post<ImportarCsvHistoricoResultado>(
    `${env.BASE_URL}/financeiro/lancamentos/importar-csv-historico`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};

export const importarOfxContasPagar = async (
  file: File,
  idCategoria: number,
  idConta?: number,
) => {
  const formData = new FormData();
  formData.append('arquivo', file);
  formData.append('idCategoria', String(idCategoria));
  if (idConta != null && !Number.isNaN(idConta)) {
    formData.append('idConta', String(idConta));
  }
  return await Axios.post<ImportarOfxContasPagarResultado>(
    `${env.BASE_URL}/financeiro/ofx/importar-contas-pagar`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};

export interface ClassificarSemCategoriaResultado {
  processados: number;
  classificados: number;
  semMatch: number;
}

/** Executa a classificação manual de lançamentos de despesa sem categoria ou com categoria DESCONHECIDA. */
export const classificarLancamentosSemCategoria = async (): Promise<ClassificarSemCategoriaResultado> => {
  const response = await Axios.post<ClassificarSemCategoriaResultado>(
    `${env.BASE_URL}/financeiro/lancamentos/classificar-sem-categoria`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    },
  );
  return response.data;
};
