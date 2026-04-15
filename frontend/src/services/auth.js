import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const loginUser = async (usuario, password, rol) => {
  const response = await axios.post("http://localhost:8000/api/login/", {
    usuario,
    password,
    rol
  });

  return response.data;
};