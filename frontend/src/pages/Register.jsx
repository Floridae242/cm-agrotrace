import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Register(){
  const [name, setName] = useState('คุณชาวสวน')
  const [email, setEmail] = useState('farmer@example.com')
  const [password, setPassword] = useState('test1234')
  const [role, setRole] = useState('FARMER')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setErr('')
    try{
      const res = await api.post('/auth/register', { name, email, password, role })
      localStorage.setItem('token', res.token)
      nav('/')
    }catch(e){
      setErr(e.message || 'สมัครล้มเหลว')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">สมัครสมาชิก</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><div className="label">ชื่อ</div><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><div className="label">อีเมล</div><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><div className="label">รหัสผ่าน</div><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div>
            <div className="label">บทบาท</div>
            <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="FARMER">ชาวสวน</option>
              <option value="PACKHOUSE">โรงคัดบรรจุ</option>
              <option value="BUYER">ผู้ซื้อ</option>
              <option value="INSPECTOR">ผู้ตรวจสอบ</option>
            </select>
          </div>
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button className="btn w-full">สมัครสมาชิก</button>
        </form>
        <div className="text-sm mt-3">มีบัญชีแล้ว? <Link className="link" to="/login">เข้าสู่ระบบ</Link></div>
      </div>
    </div>
  )
}
