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

export const cadastrarTabelaPrecoProduto = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/tabelaPrecoProduto`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizarTabelaPrecoProduto = async (data: any, idTabelaPrecoProduto: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/tabelaPrecoProduto/${idTabelaPrecoProduto}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};


export const buscarTabelaPrecoProduto = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscartabelaPrecoProdutoPorId = async (idTrabalho: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto/${idTrabalho}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarTabelaPrecoVigente = async (data: Date) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto/vigente/${data.toISOString()}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarTabelasProximasVencimento = async (diasAntecedencia: number = 30) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto/proximas-vencimento?diasAntecedencia=${diasAntecedencia}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarTabelasMatriz = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto/matriz`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarVersoesTabela = async (idMatriz: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/tabelaPrecoProduto/${idMatriz}/versoes`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const criarNovaVersao = async (idOrigem: number, dadosVersao: { numeroVersao: string }) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/tabelaPrecoProduto/${idOrigem}/nova-versao`,
    data: dadosVersao,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};
