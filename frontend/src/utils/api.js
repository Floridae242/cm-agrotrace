import axios from "axios";

// ใช้ ENV ถ้ามี; ถ้าไม่มีให้ fallback เป็น BACKEND URL ตรง ๆ
const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : "https://cm-agrotrace.onrender.com";

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token") || "";
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const api = {
  base() { return `${API_BASE}/api`; },

  async get(path)  { const { data } = await instance.get(path);  return data; },
  async post(path, payload) { const { data } = await instance.post(path, payload); return data; },
  async del(path)  { const { data } = await instance.delete(path); return data; },

  async me() {
    try { const { data } = await instance.get("/me"); return data; }
    catch { return null; }
  },
  async useMe() { return this.me(); },

  async getPublic(path) {
    const { data } = await axios.get(`${API_BASE}/api${path}`);
    return data;
  },
};

export default api;
export { API_BASE };
