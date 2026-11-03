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

export const cadastrarEmpresaTabelaPreco = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/empresa-tabela-preco`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizarEmpresaTabelaPreco = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/empresa-tabela-preco/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarAssociacoesPorEmpresa = async (idEmpresa: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa-tabela-preco/empresa/${idEmpresa}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarAssociacaoPorId = async (id: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa-tabela-preco/${id}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const desativarAssociacao = async (id: number) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/empresa-tabela-preco/${id}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};
