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

export const cadastrarTrabalho = async (data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/trabalho`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizarTrabalho = async (data: any, idTrabalho: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/trabalho/${idTrabalho}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizarAnotacoesTrabalho = async (data: any, idTrabalho: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/trabalho/${idTrabalho}/anotacoes`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const atualizaStatus = async (data: any, idTrabalho: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/trabalho/${idTrabalho}/status`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const enviaTrabalhoProducao = async (idTrabalho: number) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/trabalho/${idTrabalho}/enviaproducao`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarTrabalhosConcluidos = async (idEmpresa?: string, dataInicio?: Date, dataFim?: Date) => {
  const idEmpresaSend = idEmpresa;

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/trabalhoconcluidos`,
    params: {
      dataInicio,
      dataFim
    },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};

export const buscarRelatorio = async (idEmpresa: string, statusTrabalho: string[], dataInicio: Date, dataFim: Date) => {
  const idEmpresaSend = idEmpresa;

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/relatorio`,
    params: {
      dataInicio,
      dataFim,
      statusTrabalho
    },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};

export const buscarDashboardStatus = async (dataInicio: Date, dataFim: Date) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/relatorio/dashboard-status`,
    params: {
      dataInicio,
      dataFim
    },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const buscarTrabalhosPendentes = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/trabalhopendentes`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const trocaOrdemFila = async (trabalhos: any) => {
  const options = {
    method: "PUT",
    url: `${env.BASE_URL}/ordenatrabalhos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    },
    data: trabalhos
  };

  return await Axios(options);
};

export const buscarTrabalhos = async (statusTrabalho: string[]) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/trabalho`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    },
    params: {
      statusTrabalho
    },
  };

  return await Axios(options);
};

export const buscarTrabalho = async (idTrabalho: number) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/trabalho/${idTrabalho}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};

export const enviarFotosEscaneamento = async (idTrabalho: string, data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/arquivo/trabalho/${idTrabalho}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "multipart/form-data"
    }
  };

  return await Axios(options);
};

export const enviarFotosPaciente = async (idTrabalho: string, data: any) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/paciente/foto/trabalho/${idTrabalho}`,
    data,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "multipart/form-data"
    }
  };

  return await Axios(options);
};

export const deleteArquivoEscaneamento = async (idTrabalho: string, idArquivo: string) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/arquivo/trabalho/${idTrabalho}/arquivo/${idArquivo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "multipart/form-data"
    }
  };

  return await Axios(options);
};

export const deleteFotoPaciente = async (idTrabalho: string, idArquivo: string) => {
  const options = {
    method: "DELETE",
    url: `${env.BASE_URL}/paciente/trabalho/${idTrabalho}/arquivo/${idArquivo}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "multipart/form-data"
    }
  };

  return await Axios(options);
};

export const buscaCategoriasProdutosEmpresa = async (idEmpresa: string) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const options = {
    method: "GET",
    url: `${env.BASE_URL}/categoria/trabalho/empresa/${currentUser.idEmpresa}`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      "Content-Type": "multipart/form-data"
    }
  };

  return await Axios(options);
};
