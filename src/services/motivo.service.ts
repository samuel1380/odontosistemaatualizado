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

export type MotivoTipo = "RETRABALHO" | "BONIFICACAO";

export const cadastrarMotivo = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/motivo`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  return await Axios(options);
};

export const alterarMotivo = async (data: any, id: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/motivo/${id}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  return await Axios(options);
};

export const buscarMotivos = async (params?: { tipo?: MotivoTipo; todas?: boolean }) => {
  const query = new URLSearchParams();
  if (params?.tipo) query.set("tipo", params.tipo);
  if (params?.todas) query.set("todas", "1");
  const qs = query.toString();

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/motivo${qs ? `?${qs}` : ""}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  return await Axios(options);
};

export const buscarMotivoPorId = async (idMotivo: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/motivo/${idMotivo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  return await Axios(options);
};

export const desativarMotivo = async (idMotivo: number) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/motivo/${idMotivo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  return await Axios(options);
};

