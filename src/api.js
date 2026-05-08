// // src/api.js
// import axios from "axios";

// export const api = axios.create({
//   baseURL: "   https://mutakegirlshostel-0ko7.onrender.com", // <-- your backend URL
// });



// src/api.js
import axios from "axios";

export const API_BASE = (
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  "https://mutakegirlshostel-0ko7.onrender.com/api"
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
