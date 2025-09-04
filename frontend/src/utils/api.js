// frontend/src/utils/api.js
import axios from 'axios'

// ===== BACKEND BASE (ต้องตั้ง .env.production: VITE_API_BASE=https://cm-agrotrace.onrender.com)
const API_BASE = (import.meta?.env?.VITE_API_BASE || 'https://cm-agrotrace.onrender.com')
  .toString()
  .trim()
  .replace(/\/$/, '') // ตัด '/' ท้าย

// helper: ต่อ path ให้เป็น URL เต็มของ backend (ใช้กับ <img src>, download file ฯลฯ)
export const buildApiUrl = (path = '') =>
  `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

instance.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token') || ''
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// helper message
function asMessage(err) {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.message) return err.message
  return 'REQUEST_FAILED'
}

const api = {
  base() { return `${API_BASE}/api` },

  async get(path) {
    try {
      const { data } = await instance.get(path)
      return data
    } catch (e) {
      throw new Error(asMessage(e))
    }
  },

  async post(path, payload) {
    try {
      const { data } = await instance.post(path, payload)
      return data
    } catch (e) {
      throw new Error(asMessage(e))
    }
  },

  // รองรับ 204
  async del(path) {
    try {
      const res = await instance.delete(path)
      return res.status
    } catch (e) {
      throw new Error(asMessage(e))
    }
  },

  async me() {
    try {
      const { data } = await instance.get('/me')
      return data
    } catch {
      return null
    }
  },

  async useMe() { return this.me() },

  // public GET (ข้าม interceptor ได้ ใช้ url เต็ม)
  async getPublic(path) {
    try {
      const { data } = await axios.get(buildApiUrl(path))
      return data
    } catch (e) {
      throw new Error(asMessage(e))
    }
  },
}

export default api
export { API_BASE }
