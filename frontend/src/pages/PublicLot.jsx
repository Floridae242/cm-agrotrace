import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

export default function PublicLot(){
  const { lotId } = useParams()
  const [lot, setLot] = useState(null)
  const [err, setErr] = useState('')

  useEffect(()=>{
    async function load(){
      try{
        const data = await api.getPublic(`/lots/public/${lotId}`)
        setLot(data)
      }catch(e){
        setErr(e.message || 'ไม่พบข้อมูล')
      }
    }
    load()
  }, [lotId])

  if(err) return <div className="max-w-xl mx-auto card">{err}</div>
  if(!lot) return <div className="max-w-xl mx-auto card">กำลังโหลด...</div>

  return (
    <div className="max-w-xl mx-auto card">
      <div className="text-xl font-semibold">ผลผลิต: {lot.cropType} • {lot.variety || '—'}</div>
      <div className="text-slate-600">Lot ID: {lot.lotId}</div>
      <div className="text-slate-600 text-sm">สวน {lot.farmName || '—'} • {lot.district || ''} {lot.province || ''}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="card"><div className="text-slate-500">เก็บเกี่ยว</div><div className="font-medium">{new Date(lot.harvestDate).toLocaleDateString('th-TH')}</div></div>
        <div className="card"><div className="text-slate-500">Brix</div><div className="font-medium">{lot.brix ?? '—'}</div></div>
        <div className="card"><div className="text-slate-500">ความชื้น</div><div className="font-medium">{lot.moisture ?? '—'}%</div></div>
        <div className="card"><div className="text-slate-500">สารตกค้าง</div><div className={lot.pesticidePass ? 'font-medium text-emerald-600' : 'font-medium text-red-600'}>{lot.pesticidePass===null?'ไม่ทราบ':(lot.pesticidePass?'ผ่าน':'ไม่ผ่าน')}</div></div>
      </div>
      <div className="text-xs text-slate-500 break-all mt-2">Hash: {lot.hash}</div>
      <div className="mt-3">
        <div className="font-semibold">ไทม์ไลน์</div>
        <ul className="space-y-2 mt-1">
          {lot.events.map(ev => (
            <li key={ev.id} className="border rounded-xl p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{ev.type}</div>
                <div className="text-xs text-slate-500">{new Date(ev.timestamp).toLocaleString('th-TH',{hour12:false})}</div>
              </div>
              <div className="text-sm text-slate-600">สถานที่: {ev.locationName || '—'}</div>
              {ev.note && <div className="text-sm">หมายเหตุ: {ev.note}</div>}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 text-sm text-slate-500">
        สร้างด้วย CM‑AgroTrace • <Link className="link" to="/">ไปยังแดชบอร์ด</Link>
      </div>
    </div>
  )
}
