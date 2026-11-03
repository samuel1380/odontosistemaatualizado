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

export const cadastrarEmpresa = async (body: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/empresa`,
    data: body
  };

  return await Axios(options);
};

export const editarEmpresa = async (idEmpresa: string | null, body: any) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/empresa/${idEmpresa}`,
    data: body,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarEmpresasEmAprovacao = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa/aguardandoaprovacao`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options)
};

export const buscarEmpresas = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options)
};

export const buscarInfosCadastroComplementar = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/cadastrocomplementar/infos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options)
};

export const buscarCadastroComplementar = async (idEmpresa: string | null) => {
  if (!idEmpresa) return
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/cadastrocomplementar`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      idEmpresa: idEmpresa
    }
  };

  return await Axios(options)
};

export const cadastrarCadastroComplementar = async (cadastroComplementar: any, idEmpresa: string | null) => {
  if (!idEmpresa) return
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/cadastrocomplementar`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      idEmpresa: idEmpresa
    },
    data: cadastroComplementar
  };

  return await Axios(options)
};

export const buscarEmpresa = async (idEmpresa: string) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa/${idEmpresa}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const aprovarEmpresa = async (idEmpresa: string) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/empresa/aprovar/${idEmpresa}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const desativarEmpresa = async (idEmpresa: string) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/empresa/${idEmpresa}/desativar`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizarPagamentoCadastroComplementar = async (idEmpresa: string, diaPagamento: number | null, tipoPagamento: string | null, quantidadeParcelas: number | null) => {
  const options = {
    method: "PATCH",
    url: `${env.BASE_URL}/cadastrocomplementar/pagamento`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      idEmpresa: idEmpresa
    },
    data: { diaPagamento, tipoPagamento, quantidadeParcelas }
  };

  return await Axios(options);
};
