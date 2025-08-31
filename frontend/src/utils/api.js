// frontend/src/utils/api.js
import axios from 'axios'

// ใช้ ENV ถ้ามี; ถ้าไม่มีให้ fallback เป็น "โดเมน BACKEND" โดยตรง
// *** แก้แล้ว: ชี้ไป https://cm-agrotrace.onrender.com ไม่ใช่โดเมน frontend ***
const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : 'https://cm-agrotrace.onrender.com';

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// แนบ token อัตโนมัติถ้ามี
instance.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || '';
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// รวมเมธอดไว้ในออบเจ็กต์เดียวและ export default
const api = {
  base() { return `${API_BASE}/api`; },

  async get(path) {
    const { data } = await instance.get(path);
    return data;
  },

  async post(path, payload) {
    const { data } = await instance.post(path, payload);
    return data;
  },

  // ใช้ตรวจ session ปัจจุบัน
  async me() {
    try {
      const { data } = await instance.get('/me');
      return data;
    } catch {
      return null;
    }
  },

  // alias เพื่อความเข้ากันได้กับโค้ดเดิมที่เรียก api.useMe()
  async useMe() {
    return await this.me();
  },

  // public endpoint (ไม่ต้อง auth)
  async getPublic(path) {
    const { data } = await axios.get(`${API_BASE}/api${path}`);
    return data;
  }
};

export default api;
export { API_BASE };
