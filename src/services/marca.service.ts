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

export const alterarMarca = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/marcacomponente/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cadastrarMarca = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/marcacomponente`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarMarca = async (marcaId: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/marcacomponente/${marcaId}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarMarcas = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/marcacomponente/ativos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};
