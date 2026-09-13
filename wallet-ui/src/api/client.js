import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("wallet_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ekstrak pesan error yang jelas dari response API, apapun bentuknya.
export function extractErrorMessage(error, fallback = "Terjadi kesalahan. Coba lagi.") {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors) {
    const first = Object.values(error.response.data.errors)[0];
    if (Array.isArray(first)) return first[0];
  }
  if (error?.message === "Network Error") {
    return "Tidak bisa terhubung ke server. Pastikan backend sedang berjalan.";
  }
  return fallback;
}

export default client;
