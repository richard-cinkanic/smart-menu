import axios from "axios";
import { getAuthToken } from "../utils/authStorage";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL
  ?? "/api" });
  
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
