import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://cm-agrotrace.onrender.com'

const instance = axios.create({
  baseURL: API_BASE + '/api',
  timeout: 15000
})

function token(){
  return localStorage.getItem('token') || ''
}

instance.interceptors.request.use(cfg => {
  const t = token()
  if(t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

export default {
  base(){ return API_BASE + '/api' },
  async get(path){
    const { data } = await instance.get(path)
    return data
  },
  async post(path, payload){
    const { data } = await instance.post(path, payload)
    return data
  },
  async useMe(){
    try{
      const { data } = await instance.get('/me')
      return data
    }catch(e){ return null }
  },
  async getPublic(path){
    const { data } = await axios.get(API_BASE + '/api' + path)
    return data
  }
}
