// frontend/src/utils/api.js
import axios from 'axios'

// ใช้ ENV ถ้ามี; ถ้าไม่มีให้ fallback เป็นโดเมน BACKEND โดยตรง
const API_BASE =
  (import.meta?.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim())
    ? String(import.meta.env.VITE_API_BASE).trim()
    : 'https://cm-agrotrace.onrender.com'

// อินสแตนซ์หลักที่อิง /api
const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// แนบ Bearer token อัตโนมัติเมื่อมี
instance.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token') || ''
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// รวมเมธอดใช้งานทั้งหมด
const api = {
  // base URL ของ API (เผื่อไว้ใช้ประกอบ URL รูป/ไฟล์ ฯลฯ)
  base() {
    return `${API_BASE}/api`
  },

  // HTTP helpers
  async get(path) {
    const { data } = await instance.get(path)
    return data
  },

  async post(path, payload) {
    const { data } = await instance.post(path, payload)
    return data
  },

  async del(path) {
    const { data } = await instance.delete(path)
    return data
  },

  // ตรวจ session ของผู้ใช้ปัจจุบัน
  async me() {
    try {
      const { data } = await instance.get('/me')
      return data
    } catch {
      return null
    }
  },

  // alias สำหรับโค้ดเก่าที่เรียก useMe()
  async useMe() {
    return await this.me()
  },

  // เรียก public endpoint ที่ไม่ต้อง auth (เช่น /lots/public/:lotId)
  async getPublic(path) {
    const { data } = await axios.get(`${API_BASE}/api${path}`)
    return data
  },
}

export default api
export { API_BASE }
