import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function CreateLot(){
  const nav = useNavigate()
  const [form, setForm] = useState({
    lotId: '',
    cropType: 'ลำไย (Longan)',
    variety: 'อีดอ',
    farmName: 'สวนลำไยภูพิงค์',
    province: 'เชียงใหม่',
    district: 'ฝาง',
    harvestDate: new Date().toISOString().slice(0,10),
    brix: 20,
    moisture: 78,
    pesticidePass: true,
    notes: ''
  })
  const [err, setErr] = useState('')

  function set(k,v){ setForm(s => ({...s, [k]: v})) }

  async function submit(e){
    e.preventDefault()
    setErr('')
    try{
      const data = await api.post('/lots', form)
      nav(`/lot/${data.lotId}`)
    }catch(e){
      setErr(e.message || 'ไม่สามารถสร้างล็อตได้')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">สร้างล็อตผลผลิต</h1>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
          <div><div className="label">Lot ID (ว่างให้ระบบสร้าง)</div><input className="input" value={form.lotId} onChange={e=>set('lotId',e.target.value)} /></div>
          <div><div className="label">ชนิดพืช</div><input className="input" value={form.cropType} onChange={e=>set('cropType',e.target.value)} /></div>
          <div><div className="label">สายพันธุ์</div><input className="input" value={form.variety} onChange={e=>set('variety',e.target.value)} /></div>
          <div><div className="label">ชื่อแปลง/สวน</div><input className="input" value={form.farmName} onChange={e=>set('farmName',e.target.value)} /></div>
          <div><div className="label">จังหวัด</div><input className="input" value={form.province} onChange={e=>set('province',e.target.value)} /></div>
          <div><div className="label">อำเภอ</div><input className="input" value={form.district} onChange={e=>set('district',e.target.value)} /></div>
          <div><div className="label">วันเก็บเกี่ยว</div><input type="date" className="input" value={form.harvestDate} onChange={e=>set('harvestDate',e.target.value)} /></div>
          <div><div className="label">Brix (ความหวาน)</div><input className="input" type="number" step="0.1" value={form.brix} onChange={e=>set('brix',parseFloat(e.target.value))} /></div>
          <div><div className="label">ความชื้น (%)</div><input className="input" type="number" step="0.1" value={form.moisture} onChange={e=>set('moisture',parseFloat(e.target.value))} /></div>
          <div>
            <div className="label">ผลการตรวจสารตกค้าง</div>
            <select className="input" value={form.pesticidePass} onChange={e=>set('pesticidePass', e.target.value === 'true')}>
              <option value="true">ผ่าน</option>
              <option value="false">ไม่ผ่าน</option>
            </select>
          </div>
          <div className="md:col-span-2"><div className="label">บันทึกเพิ่มเติม</div><textarea className="input" rows="3" value={form.notes} onChange={e=>set('notes',e.target.value)} /></div>
          {err && <div className="text-red-600 text-sm md:col-span-2">{err}</div>}
          <div className="md:col-span-2"><button className="btn w-full">บันทึกล็อต</button></div>
        </form>
      </div>
    </div>
  )
}
