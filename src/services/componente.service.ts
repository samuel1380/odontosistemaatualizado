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

export const alterarComponente = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/componente/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cadastrarComponente = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/componente`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarComponentes = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/componente/ativos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarComponentePorId = async (componenteId: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/componente/${componenteId}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarComponentesEmpresa = async (idEmpresa?: number) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const idEmpresaSend = currentUser.empresas.length && currentUser.empresas[0].idEmpresa || idEmpresa;

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/componenteempresa`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};
