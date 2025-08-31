import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function App(){
  const nav = useNavigate()
  const me = api.useMe()

  function logout(){
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-xl text-sky-700">CM‑AgroTrace</Link>
          <nav className="flex gap-3 items-center">
            <Link to="/" className="link">แดชบอร์ด</Link>
            <Link to="/create" className="link">สร้างล็อต</Link>
            {me?.name ? (
              <>
                <span className="text-sm">สวัสดี, {me.name} ({me.role})</span>
                <button className="btn" onClick={logout}>ออกจากระบบ</button>
              </>
            ) : (
              <>
                <Link className="link" to="/login">เข้าสู่ระบบ</Link>
                <Link className="link" to="/register">สมัคร</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Outlet/>
      </main>
      <footer className="text-center text-xs text-slate-500 py-6">© 2025 CM‑AgroTrace • Software‑only traceability for Chiang Mai</footer>
    </div>
  )
}

