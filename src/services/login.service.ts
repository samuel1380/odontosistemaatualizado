import Axios from "axios";
import { env } from "./envfile";

export const realizaLogin = async (username: string, password:string) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/login`,
    data: {
      username,
      password,
    },
  };

  return await Axios(options)
};
