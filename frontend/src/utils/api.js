// frontend/src/utils/api.js
import axios from 'axios'

// ตั้งค่า BASE ของ backend
const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : 'https://cm-agrotrace.onrender.com';

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || '';
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// helper อ่าน error ให้สั้น
function asMessage(err) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.message) return err.message;
  return 'REQUEST_FAILED';
}

const api = {
  base() { return `${API_BASE}/api`; },

  async get(path) {
    try {
      const { data } = await instance.get(path);
      return data;
    } catch (e) {
      throw new Error(asMessage(e));
    }
  },

  async post(path, payload) {
    try {
      const { data } = await instance.post(path, payload);
      return data;
    } catch (e) {
      throw new Error(asMessage(e));
    }
  },

  // ⚠️ รองรับ 204/empty โดยไม่อ่าน body
  async del(path) {
    try {
      const res = await instance.delete(path);
      // 204 ไม่มี body -> return ง่ายๆ
      return res.status;
    } catch (e) {
      throw new Error(asMessage(e));
    }
  },

  async me() {
    try {
      const { data } = await instance.get('/me');
      return data;
    } catch {
      return null;
    }
  },

  async useMe() { return this.me(); },

  async getPublic(path) {
    try {
      const { data } = await axios.get(`${API_BASE}/api${path}`);
      return data;
    } catch (e) {
      throw new Error(asMessage(e));
    }
  }
};

export default api;
export { API_BASE };
