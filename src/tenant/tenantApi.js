// Hard-coded backend origin (no .env needed)
const ORIGIN = "http://localhost:8000";
export const API = `${ORIGIN}/api`;

export function setToken(t){ localStorage.setItem("tenantToken", t); }
export function getToken(){ return localStorage.getItem("tenantToken"); }
export function clearToken(){ localStorage.removeItem("tenantToken"); }
export function authHeader(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
