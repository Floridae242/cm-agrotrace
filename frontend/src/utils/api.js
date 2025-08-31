// frontend/src/utils/api.js
import axios from 'axios'
const API_BASE = (import.meta?.env?.VITE_API_BASE?.trim())
  || 'https://cm-agrotrace.onrender.com'

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

instance.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || ''
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

const api = {
  base(){ return `${API_BASE}/api` },
  async get(p){ const { data } = await instance.get(p); return data },
  async post(p,b){ const { data } = await instance.post(p,b); return data },
  async del(p){ const { data } = await instance.delete(p); return data },
  async me(){ try{ const { data } = await instance.get('/me'); return data } catch { return null } },
  async useMe(){ return await this.me() },
  async getPublic(p){ const { data } = await axios.get(`${API_BASE}/api${p}`); return data }
}
export default api
export { API_BASE }
