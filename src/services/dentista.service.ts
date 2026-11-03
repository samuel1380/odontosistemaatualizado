import Axios from "axios";
import { env } from "./envfile";

export const buscarDentistas = async (idEmpresa?: number) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const idEmpresaSend = idEmpresa || currentUser.empresas.length && currentUser.empresas[0].idEmpresa
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/dentista`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};

export const buscaDentistaPorEmpresaId = async (idEmpresa?: number) => {
  const currentUserString = localStorage.getItem("currentUser");
  if (!currentUserString) return;
  const currentUser = JSON.parse(currentUserString);

  const idEmpresaSend = idEmpresa || currentUser.empresas.length && currentUser.empresas[0].idEmpresa
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/dentista/idEmpresa`,
    headers: {
      Authorization: `Bearer ${currentUser.token}`, // This one is correct because of the guard clause above
      idEmpresa: idEmpresaSend
    }
  };

  return await Axios(options);
};
