import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'

export default function LotDetails(){
  const { lotId } = useParams()
  const [lot, setLot] = useState(null)
  const [evt, setEvt] = useState({ type: 'TRANSPORTED', locationName: '', fromName: '', toName: '', temperature: '', humidity: '', note: '' })
  const [err, setErr] = useState('')

  async function load(){
    try{
      const data = await api.get(`/lots/${lotId}`)
      setLot(data)
    }catch(e){ setErr(e.message) }
  }

  useEffect(()=>{ load() }, [lotId])

  async function addEvent(e){
    e.preventDefault()
    setErr('')
    try{
      const payload = { ...evt }
      if(payload.temperature === '') delete payload.temperature
      if(payload.humidity === '') delete payload.humidity
      const data = await api.post(`/lots/${lotId}/events`, payload)
      setEvt({ type: 'TRANSPORTED', locationName: '', fromName: '', toName: '', temperature: '', humidity: '', note: '' })
      load()
    }catch(e){ setErr(e.message) }
  }

  if(!lot) return <div>กำลังโหลด...</div>

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">{lot.lotId}</div>
            <div className="text-slate-600 text-sm">{lot.cropType} • {lot.variety || '—'}</div>
            <div className="text-slate-600 text-sm">สวน {lot.farmName || '—'} • {lot.district || ''} {lot.province || ''}</div>
          </div>
          <img className="w-28 h-28" src={`${api.base()}/lots/${lot.lotId}/qr`} alt="qr"/>
        </div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="card"><div className="text-slate-500">เก็บเกี่ยว</div><div className="font-medium">{new Date(lot.harvestDate).toLocaleDateString('th-TH')}</div></div>
          <div className="card"><div className="text-slate-500">Brix</div><div className="font-medium">{lot.brix ?? '—'}</div></div>
          <div className="card"><div className="text-slate-500">ความชื้น</div><div className="font-medium">{lot.moisture ?? '—'}%</div></div>
          <div className="card"><div className="text-slate-500">สารตกค้าง</div><div className={lot.pesticidePass ? 'font-medium text-emerald-600' : 'font-medium text-red-600'}>{lot.pesticidePass===null?'ไม่ทราบ':(lot.pesticidePass?'ผ่าน':'ไม่ผ่าน')}</div></div>
        </div>
        <div className="mt-2 text-xs text-slate-500 break-all">Hash: {lot.hash}</div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">ไทม์ไลน์</div>
        <ul className="space-y-2">
          {lot.events.map(ev => (
            <li key={ev.id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{ev.type}</div>
                <div className="text-xs text-slate-500">{new Date(ev.timestamp).toLocaleString('th-TH',{hour12:false})}</div>
              </div>
              <div className="text-sm text-slate-600">สถานที่: {ev.locationName || '—'}</div>
              {(ev.fromName || ev.toName) && <div className="text-sm text-slate-600">จาก {ev.fromName || '—'} → {ev.toName || '—'}</div>}
              {(ev.temperature!=null || ev.humidity!=null) && <div className="text-sm text-slate-600">อุณหภูมิ: {ev.temperature ?? '—'}°C • ความชื้น: {ev.humidity ?? '—'}%</div>}
              {ev.note && <div className="text-sm">หมายเหตุ: {ev.note}</div>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">เพิ่มเหตุการณ์</div>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={addEvent}>
          <div>
            <div className="label">ประเภท</div>
            <select className="input" value={evt.type} onChange={e=>setEvt(s=>({...s, type:e.target.value}))}>
              <option>TRANSPORTED</option>
              <option>INSPECTED</option>
              <option>SENSOR_READING</option>
              <option>MERGED</option>
              <option>SOLD</option>
            </select>
          </div>
          <div><div className="label">สถานที่</div><input className="input" value={evt.locationName} onChange={e=>setEvt(s=>({...s, locationName:e.target.value}))}/></div>
          <div><div className="label">จาก</div><input className="input" value={evt.fromName} onChange={e=>setEvt(s=>({...s, fromName:e.target.value}))}/></div>
          <div><div className="label">ไปยัง</div><input className="input" value={evt.toName} onChange={e=>setEvt(s=>({...s, toName:e.target.value}))}/></div>
          <div><div className="label">อุณหภูมิ (°C)</div><input type="number" className="input" value={evt.temperature} onChange={e=>setEvt(s=>({...s, temperature:e.target.value}))}/></div>
          <div><div className="label">ความชื้น (%)</div><input type="number" className="input" value={evt.humidity} onChange={e=>setEvt(s=>({...s, humidity:e.target.value}))}/></div>
          <div className="md:col-span-3"><div className="label">หมายเหตุ</div><textarea className="input" rows="2" value={evt.note} onChange={e=>setEvt(s=>({...s, note:e.target.value}))}/></div>
          {err && <div className="text-red-600 text-sm md:col-span-3">{err}</div>}
          <div className="md:col-span-3"><button className="btn w-full">บันทึกเหตุการณ์</button></div>
        </form>
      </div>
    </div>
  )
}
