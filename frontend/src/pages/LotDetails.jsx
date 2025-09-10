// frontend/src/pages/LotDetails.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE } from '../utils/api.js';

function Info({ label, value, positive }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg ${positive ? 'text-green-600' : ''}`}>{value}</div>
    </div>
  );
}

export default function LotDetails() {
  const nav = useNavigate();
  const { lotId } = useParams();

  const [me, setMe] = React.useState(null);
  const [lot, setLot] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [err, setErr] = React.useState('');

  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    type: 'TRANSPORTED',
    locationName: '',
    fromName: '',
    toName: '',
    temperature: '',
    humidity: '',
    note: '',
  });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const user = await api.me();
        setMe(user);
        const resp = await api.getPublic(`/lots/public/${encodeURIComponent(lotId)}`);
        setLot(resp.lot || null);
        setEvents(resp.events || []);
      } catch (e) {
        console.error('โหลดล็อตล้มเหลว', e);
        setErr('ไม่พบล็อตนี้หรือเกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    })();
  }, [lotId]);

  const canWrite = React.useMemo(() => {
    if (!me || !lot) return false;
    return me.role === 'ADMIN' || me.id === lot.ownerId;
  }, [me, lot]);

  async function handleDelete() {
    if (!canWrite) return;
    if (!confirm(`ยืนยันการลบล็อต: ${lotId} ?`)) return;
    try {
      setDeleting(true);
      await api.del(`/lots/${encodeURIComponent(lotId)}`);
      alert('ลบล็อตสำเร็จ');
      nav('/dashboard');
    } catch (e) {
      console.error('ลบไม่สำเร็จ', e);
      alert('ลบไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }

  async function submitEvent(e) {
    e.preventDefault();
    if (!canWrite || !lot) return;
    try {
      setSaving(true);
      const payload = {
        type: form.type,
        locationName: form.locationName || null,
        fromName: form.fromName || null,
        toName: form.toName || null,
        temperature: form.temperature === '' ? null : Number(form.temperature),
        humidity: form.humidity === '' ? null : Number(form.humidity),
        note: form.note || null,
      };
      await api.post(`/lots/${encodeURIComponent(lot.lotId)}/events`, payload);

      const refreshed = await api.getPublic(`/lots/public/${encodeURIComponent(lotId)}`);
      setEvents(refreshed.events || []);

      setForm({
        type: 'TRANSPORTED',
        locationName: '',
        fromName: '',
        toName: '',
        temperature: '',
        humidity: '',
        note: '',
      });
    } catch (err) {
      console.error('บันทึกเหตุการณ์ล้มเหลว', err);
      alert('บันทึกเหตุการณ์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!lot) return <div className="p-6 text-gray-500">ไม่มีข้อมูลล็อต</div>;

  // URL รูป QR
  const BACKEND = API_BASE.replace(/\/$/, '');
  const qrSrc = lot?.lotId
    ? `${BACKEND}/api/lots/${encodeURIComponent(lot.lotId)}/qr?ts=${Date.now()}`
    : '';

  // ปัจจุบันถึงที่ไหน (ใช้ toName ล่าสุด ก่อน fallback เป็น locationName)
  const currentPlace = React.useMemo(() => {
    if (!events || events.length === 0) return '-';
    const found = [...events].reverse().find(ev => ev.toName || ev.locationName);
    return found?.toName || found?.locationName || '-';
  }, [events]);

  // เวลาอัปเดตล่าสุด
  const lastUpdatedAt = React.useMemo(() => {
    if (!events || events.length === 0) return '';
    const last = events[events.length - 1];
    return last?.timestamp ? new Date(last.timestamp).toLocaleString('th-TH') : '';
  }, [events]);

  return (
    <div className="p-6 space-y-6">
      {/* หัวเรื่อง + ปุ่มลบ */}
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
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
            <Info label="ปัจจุบันถึง" value={currentPlace} />
          </div>

          <div className="text-xs text-gray-500 mt-3 break-all">Hash: {lot.hash}</div>
          {lastUpdatedAt && (
            <div className="text-xs text-gray-500 mt-1">อัปเดตล่าสุด: {lastUpdatedAt}</div>
          )}
        </div>

        {/* QR */}
        <div className="p-4 bg-white rounded-2xl shadow flex items-center justify-center">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="qr"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                e.currentTarget.src =
                  `${BACKEND}/api/lots/${encodeURIComponent(lot.lotId)}/qr?ts=${Date.now()}`;
              }}
            />
          ) : (
            <div className="text-sm text-gray-400">ไม่มี QR</div>
          )}
        </div>
      </div>

      {/* ไทม์ไลน์ */}
      <div className="p-4 bg-white rounded-2xl shadow space-y-3">
        <div className="font-semibold mb-2">ไทม์ไลน์</div>

        {events.length === 0 && (
          <div className="text-sm text-gray-400">ยังไม่มีเหตุการณ์</div>
        )}

        {events.map((ev) => {
          const timeStr = ev.timestamp
            ? new Date(ev.timestamp).toLocaleString('th-TH')
            : '';

          const hasTemp = typeof ev.temperature === 'number';
          const hasHum = typeof ev.humidity === 'number';
          const envLine =
            hasTemp || hasHum
              ? `อุณหภูมิ: ${hasTemp ? ev.temperature : '-'}°C  ·  ความชื้น: ${hasHum ? ev.humidity : '-'}%`
              : '';

          return (
            <div key={ev.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="font-semibold tracking-wide">{ev.type}</div>

              {ev.locationName && (
                <div className="text-sm text-gray-600">{ev.locationName}</div>
              )}

              {(ev.fromName || ev.toName) && (
                <div className="text-sm text-gray-700 mt-1">
                  เส้นทาง: {ev.fromName || '-'} → {ev.toName || '-'}
                </div>
              )}

              {envLine && (
                <div className="text-sm text-gray-700 mt-1">{envLine}</div>
              )}

              {ev.note && (
                <div className="text-sm text-gray-600 mt-1">
                  หมายเหตุ: {ev.note}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">{timeStr}</div>
            </div>
          );
        })}
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
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="TRANSPORTED">TRANSPORTED</option>
                <option value="INSPECTED">INSPECTED</option>
                <option value="SENSOR_READING">SENSOR_READING</option>
                <option value="MERGED">MERGED</option>
                <option value="SOLD">SOLD</option>
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">สถานที่</label>
              <input
                className="input"
                value={form.locationName}
                onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                placeholder="เช่น คลังสินค้าเชียงใหม่"
              />
            </div>

            <div>
              <label className="text-sm block mb-1">จาก</label>
              <input
                className="input"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder="ต้นทาง (เช่น สวน/จังหวัด)"
              />
            </div>

            <div>
              <label className="text-sm block mb-1">ไปยัง</label>
              <input
                className="input"
                value={form.toName}
                onChange={(e) => setForm({ ...form, toName: e.target.value })}
                placeholder="ปลายทาง (เช่น คลัง/จังหวัด)"
              />
            </div>

            <div>
              <label className="text-sm block mb-1">อุณหภูมิ (°C)</label>
              <input
                className="input"
                type="number"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">ความชื้น (%)</label>
              <input
                className="input"
                type="number"
                value={form.humidity}
                onChange={(e) => setForm({ ...form, humidity: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm block mb-1">หมายเหตุ</label>
              <textarea
                className="input"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
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
  );
}
