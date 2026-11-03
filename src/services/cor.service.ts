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

export const alterarCor = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/cor/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cadastrarCor = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/cor`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarCor = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/cor/ativos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarCorPorId = async (componenteId: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/cor/${componenteId}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarCorEmpresa = async (idEmpresa?: number) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const idEmpresaSend = currentUser.empresas.length && currentUser.empresas[0].idEmpresa || idEmpresa;

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/corempresa`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};
