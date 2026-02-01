import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});
export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);
