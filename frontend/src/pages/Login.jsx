import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Login(){
  const [email, setEmail] = useState('farmer@example.com')
  const [password, setPassword] = useState('test1234')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setErr('')
    try{
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.token)
      nav('/')
    }catch(e){
      setErr(e.message || 'เข้าสู่ระบบล้มเหลว')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">เข้าสู่ระบบ</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="label">อีเมล</div>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <div className="label">รหัสผ่าน</div>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button className="btn w-full">เข้าสู่ระบบ</button>
        </form>
        <div className="text-sm mt-3">ยังไม่มีบัญชี? <Link className="link" to="/register">สมัครสมาชิก</Link></div>
      </div>
    </div>
  )
}
