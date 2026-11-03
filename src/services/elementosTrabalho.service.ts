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

export const buscarElementosTrabalho = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/elementosTrabalho`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  };

  return await Axios(options);
};
