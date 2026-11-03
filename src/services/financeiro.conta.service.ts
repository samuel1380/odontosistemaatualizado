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

export const cadastrarConta = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/financeiro/contas`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarContas = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/contas`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const buscarContasPorId = async (idConta: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/financeiro/contas/${idConta}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};
