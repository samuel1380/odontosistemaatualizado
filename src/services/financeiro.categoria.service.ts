
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

export const cadastrarCategoria = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/financeiro/categorias`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const atualizarCategoria = async (data: any, id: number) => {
  const options = {
    method: "PATCH",
    url: `${env.BASE_URL}/financeiro/categorias/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

/** Retorna apenas categorias principais (sem categoriaPai). Usar na lista de categorias e no dropdown "Subcategoria de". */
export const buscarCategorias = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/categorias`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

/** Retorna todas as categorias (principais + subcategorias). Usar no formulário de lançamento (categoria + subcategoria). */
export const buscarCategoriasTodas = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/categorias?todas=true`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarCategoriasPorId = async (idConta: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/categorias/${idConta}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const deleteContasPorId = async (idConta: number) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/contas/${idConta}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const deletarCategoria = async (idCategoria: number) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/financeiro/categorias/${idCategoria}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};
