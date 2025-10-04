// // src/api.js
// import axios from "axios";

// export const api = axios.create({
//   baseURL: "http://localhost:8000", // <-- your backend URL
// });



// src/api.js
import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // true only if you use cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or from your auth context
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
