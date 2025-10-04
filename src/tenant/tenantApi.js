// point this to your backend
export const API = process.env.REACT_APP_API_ORIGIN || "http://localhost:8000/api";

export function setToken(t){ localStorage.setItem("tenantToken", t); }
export function getToken(){ return localStorage.getItem("tenantToken"); }
export function clearToken(){ localStorage.removeItem("tenantToken"); }
export function authHeader(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
