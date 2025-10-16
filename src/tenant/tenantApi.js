// // Hard-coded backend origin (no .env needed)
// const ORIGIN = "http://mutakehostel-backend.onrender.com";
// export const API = `${ORIGIN}/api`;

// export function setToken(t){ localStorage.setItem("tenantToken", t); }
// export function getToken(){ return localStorage.getItem("tenantToken"); }
// export function clearToken(){ localStorage.removeItem("tenantToken"); }
// export function authHeader(){
//   const t = getToken();
//   return t ? { Authorization: `Bearer ${t}` } : {};
// }



// src/tenant/tenantApi.js
import axios from "axios";

export const TOKEN_KEY = "tenantToken";

// ✅ always HTTPS
const ORIGIN = "https://mutakehostel-backend.onrender.com";
export const API = `${ORIGIN}/api`;

export function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
export function getToken(){ return localStorage.getItem(TOKEN_KEY); }
export function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
export function authHeader(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ✅ one axios instance for ALL tenant calls
export const tenantHttp = axios.create({
  baseURL: API,
  withCredentials: false,
});

// attach bearer token automatically
tenantHttp.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${t}` };
  return cfg;
});
