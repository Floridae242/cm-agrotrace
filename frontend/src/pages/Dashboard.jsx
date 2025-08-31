import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Dashboard(){
  const [lots, setLots] = useState([])
  const nav = useNavigate()
  const me = api.useMe()

  useEffect(()=>{
    async function load(){
      try{
        const data = await api.get('/lots')
        setLots(data)
      }catch(e){
        // no token -> go login
        nav('/login')
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ล็อตของฉัน</h1>
        <Link className="btn" to="/create">+ สร้างล็อต</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {lots.map(l => (
          <div key={l.id} className="card">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{l.lotId}</div>
              <span className="badge">{new Date(l.harvestDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div className="text-slate-600 text-sm mt-1">{l.cropType} • {l.variety || '—'}</div>
            <div className="text-slate-600 text-sm">แปลง: {l.farmName || '—'} • {l.district || ''} {l.province || ''}</div>
            <div className="mt-3 flex gap-2">
              <Link className="btn" to={`/lot/${l.lotId}`}>รายละเอียด</Link>
              <a className="btn" href={`${api.base()}/lots/${l.lotId}/qr`} target="_blank">QR</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
