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

export const alterarProduto = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/produto/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cadastrarProduto = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/produto`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarProdutos = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/produto/ativos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarProduto = async (produtoId: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/produto/${produtoId}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarProdutosEmpresa = async (idEmpresa?: number) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const idEmpresaSend = currentUser.empresas.length && currentUser.empresas[0].idEmpresa || idEmpresa;

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/produtoempresa`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};
