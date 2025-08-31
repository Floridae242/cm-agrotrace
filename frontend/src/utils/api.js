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

  // ตัวหลัก: ใช้เรียก /me
  async me() {
    try {
      const { data } = await instance.get('/me')
      return data
    } catch {
      return null
    }
  },

  // ตัว alias: ใส่คืนเพื่อความเข้ากันได้กับโค้ดเดิม
  async useMe() {
    return await this.me()
  },

  async getPublic(path) {
    const { data } = await axios.get(`${API_BASE}/api${path}`)
    return data
  }
}

export default api
export { API_BASE }
