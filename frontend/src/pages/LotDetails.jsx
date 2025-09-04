import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api.js'

export default function LotDetails() {
  const nav = useNavigate()
  const { lotId } = useParams()
  const [me, setMe] = React.useState(null)
  const [lot, setLot] = React.useState(null)
  const [events, setEvents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)
  const [err, setErr] = React.useState('')

  // state ฟอร์มเพิ่มเหตุการณ์
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    type: 'TRANSPORTED',
    locationName: '',
    fromName: '',
    toName: '',
    temperature: '',
    humidity: '',
    note: ''
  })

  React.useEffect(() => {
    (async () => {
      setLoading(true)
      setErr('')
      try {
        const user = await api.me()
        setMe(user)

        // โหลดข้อมูล public ของล็อต
        const resp = await api.get(`/lots/public/${encodeURIComponent(lotId)}`)
        setLot(resp.lot || null)
        setEvents(resp.events || [])
      } catch (e) {
        console.error('โหลดล็อตล้มเหลว', e)
        setErr('ไม่พบล็อตนี้หรือเกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    })()
  }, [lotId])

  const canWrite = React.useMemo(() => {
    if (!me || !lot) return false
    return me.role === 'ADMIN' || me.id === lot.ownerId
  }, [me, lot])

  async function handleDelete() {
    if (!canWrite) return
    if (!confirm(`ยืนยันการลบล็อต: ${lotId} ?`)) return
    try {
      setDeleting(true)
      await api.del(`/lots/${encodeURIComponent(lotId)}`)
      alert('ลบล็อตสำเร็จ')
      nav('/dashboard')
    } catch (e) {
      console.error('ลบไม่สำเร็จ', e)
      alert('ลบไม่สำเร็จ')
    } finally {
      setDeleting(false)
    }
  }

  async function submitEvent(e) {
    e.preventDefault()
    if (!canWrite || !lot) return
    try {
      setSaving(true)

      // แปลงค่าเลข
      const payload = {
        type: form.type,
        locationName: form.locationName || null,
        fromName: form.fromName || null,
        toName: form.toName || null,
        temperature: form.temperature === '' ? null : Number(form.temperature),
        humidity: form.humidity === '' ? null : Number(form.humidity),
        note: form.note || null
      }

      await api.post(`/lots/${encodeURIComponent(lot.lotId)}/events`, payload)

      // โหลดรายการ event ใหม่
      const refreshed = await api.get(`/lots/public/${encodeURIComponent(lotId)}`)
      setEvents(refreshed.events || [])

      // ล้างฟอร์ม
      setForm({
        type: 'TRANSPORTED',
        locationName: '',
        fromName: '',
        toName: '',
        temperature: '',
        humidity: '',
        note: ''
      })
    } catch (err) {
      console.error('บันทึกเหตุการณ์ล้มเหลว', err)
      alert('บันทึกเหตุการณ์ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">กำลังโหลด...</div>
  if (err) return <div className="p-6 text-red-600">{err}</div>
  if (!lot) return <div className="p-6 text-gray-500">ไม่มีข้อมูลล็อต</div>

  // ✅ สร้าง URL QR + cache-buster
  const qrSrc = `/api/lots/${encodeURIComponent(lot.lotId)}/qr?ts=${Date.now()}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold">{lot.lotId}</h1>

        <div className="flex items-center gap-3">
          {canWrite && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              title="ลบล็อตนี้"
            >
              {deleting ? 'กำลังลบ...' : 'ลบล็อต'}
            </button>
          )}
        </div>
      </div>

      {/* กล่องข้อมูลหลัก */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:grid-cols-3 md:col-span-3 p-4 bg-white rounded-2xl shadow">
          <div className="text-gray-800">
            <div className="font-medium">
              {lot.cropType} · {lot.variety || '-'}
            </div>
            <div className="text-sm text-gray-500">
              {lot.farmName} · {lot.district} {lot.province}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Info
              label="เก็บเกี่ยว"
              value={lot.harvestDate ? new Date(lot.harvestDate).toLocaleDateString('th-TH') : '-'}
            />
            <Info label="Brix" value={lot.brix ?? '-'} />
            <Info label="ความชื้น" value={lot.moisture ? `${lot.moisture}%` : '-'} />
            <Info
              label="สารตกค้าง"
              value={lot.pesticidePass ? 'ผ่าน' : 'ไม่ผ่าน'}
              positive={lot.pesticidePass}
            />
          </div>

          <div className="text-xs text-gray-500 mt-3 break-all">
            Hash: {lot.hash}
          </div>
        </div>

        {/* ✅ QR */}
        <div className="p-4 bg-white rounded-2xl shadow flex items-center justify-center">
          <img
            key={qrSrc} // บังคับ React remount ทุกครั้ง
            src={qrSrc}
            alt="qr"
            className="w-48 h-48 object-contain"
            onError={(e) => {
              // fallback กัน path error/cache
              e.currentTarget.src = `/api/lots/${encodeURIComponent(lot.lotId)}/qr?ts=${Date.now()}`
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-3">ไทม์ไลน์</h2>
        {events.length === 0 ? (
          <div className="text-sm text-gray-500">ยังไม่มีเหตุการณ์</div>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="p-3 rounded-xl bg-gray-50">
                <div className="text-sm font-mono">{e.type}</div>
                <div className="text-sm text-gray-600">{e.locationName}</div>
                {e.note && <div className="text-sm text-gray-500">หมายเหตุ: {e.note}</div>}
                <div className="text-xs text-gray-400">
                  {new Date(e.timestamp || e.createdAt).toLocaleString('th-TH')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ฟอร์มเพิ่มเหตุการณ์ */}
      {canWrite && (
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="font-semibold mb-3">เพิ่มเหตุการณ์</h2>
          <form onSubmit={submitEvent} className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm block mb-1">ประเภท</label>
              <select
                className="input"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="TRANSPORTED">TRANSPORTED</option>
                <option value="WAREHOUSED">WAREHOUSED</option>
                <option value="INSPECTED">INSPECTED</option>
                <option value="PROCESSED">PROCESSED</option>
                <option value="EXPORTED">EXPORTED</option>
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">สถานที่</label>
              <input
                className="input"
                value={form.locationName}
                onChange={e => setForm({ ...form, locationName: e.target.value })}
                placeholder="เช่น คลังสินค้าเชียงใหม่"
              />
            </div>

            <div>
              <label className="text-sm block mb-1">จาก</label>
              <input
                className="input"
                value={form.fromName}
                onChange={e => setForm({ ...form, fromName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">ไปยัง</label>
              <input
                className="input"
                value={form.toName}
                onChange={e => setForm({ ...form, toName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">อุณหภูมิ (°C)</label>
              <input
                className="input"
                type="number"
                value={form.temperature}
                onChange={e => setForm({ ...form, temperature: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">ความชื้น (%)</label>
              <input
                className="input"
                type="number"
                value={form.humidity}
                onChange={e => setForm({ ...form, humidity: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm block mb-1">หมายเหตุ</label>
              <textarea
                className="input"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกเหตุการณ์'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Info({ label, value, positive }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg ${positive ? 'text-green-600' : ''}`}>{value}</div>
    </div>
  )
}
