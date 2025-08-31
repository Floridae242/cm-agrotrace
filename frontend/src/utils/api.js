// frontend/src/utils/api.js
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000
})

instance.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || ''
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// รวมทุกฟังก์ชันไว้ในอ็อบเจ็กต์เดียว แล้ว "export default" ให้แน่นอน
const api = {
  base() { return `${API_BASE}/api` },

  async get(path) {
    const { data } = await instance.get(path)
    return data
  },

  async post(path, payload) {
    const { data } = await instance.post(path, payload)
    return data
  },

  // ชื่อสั้นลงเป็น me() เพื่อใช้สะดวก
  async me() {
    try {
      const { data } = await instance.get('/me')
      return data
    } catch {
      return null
    }
  },

  async getPublic(path) {
    const { data } = await axios.get(`${API_BASE}/api${path}`)
    return data
  }
}

export default api
export { API_BASE }

