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

export const buscarAlmoxarifados = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/almoxarifado`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarEstoquePorAlmoxarifado = async (idAlmoxarifado: string | null) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/estoque/almoxarifado/${idAlmoxarifado}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarDebitosPorAlmoxarifado = async (idAlmoxarifado: string | null) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/transferencia/debitos/${idAlmoxarifado}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarHistoricoPorAlmoxarifado = async (idAlmoxarifado: string | null) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/estoque/historico/consumo/almoxarifado/${idAlmoxarifado}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};


export const cadastrarEstoque = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/estoque`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};
