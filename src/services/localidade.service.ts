import Axios from "axios";
import { env } from "./envfile";

export const buscarCEP = async (cep: string) => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/localidade/cep/${cep}`,
  };

  return await Axios(options)
};
