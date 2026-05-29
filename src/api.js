// // src/api.js
// import axios from "axios";

// export const api = axios.create({
//   baseURL: "  http://localhost:8000", // <-- your backend URL
// });



// src/api.js
import axios from "axios";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const DEFAULT_PROD_API_BASE = "http://localhost:8000/api";

function getDefaultApiBase() {
  if (typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)) {
    return "http://localhost:8000/api";
  }

  return DEFAULT_PROD_API_BASE;
}

export const API_BASE = (
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  getDefaultApiBase()
).trim().replace(/\/+$/, "");

export const API_ORIGIN = API_BASE.replace(/\/api$/, "");

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // true only if you use cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or from your auth context
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
