import { useEffect, useState } from 'react'
import { supabase, daysLeft, daysClass } from '../supabase'

const VT = ['insurance', 'ntsa_inspection', 'speed_governor', 'fire_extinguisher', 'first_aid', 'annual_service', 'other']
const DT = ['driving_licence', 'psv_badge', 'medical_certificate', 'nssf', 'sha', 'other']

export default function Compliance() {
  const [tab, setTab] = useState<'v' | 'd'>('v')
  const [vc, setVc] = useState<any[]>([]); const [dc, setDc] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([]); const [drivers, setDrivers] = useState<any[]>([])
  const [f, setF] = useState<any>({ compliance_type: 'insurance', alert_days_before: 30 }); const [err, setErr] = useState('')

  const load = async () => {
    setVc((await supabase.from('vehicle_compliance').select('*, vehicles(plate)').order('expiry_date')).data ?? [])
    setDc((await supabase.from('driver_compliance').select('*, drivers(full_name)').order('expiry_date')).data ?? [])
    setTrucks((await supabase.from('vehicles').select('id, plate')).data ?? [])
    setDrivers((await supabase.from('drivers').select('id, full_name')).data ?? [])
  }
  useEffect(() => { load() }, [])

  const all = [...vc, ...dc].map(r => daysLeft(r.expiry_date))
  const expired = all.filter(n => n <= 0).length
  const week = all.filter(n => n > 0 && n <= 7).length
  const month = all.filter(n => n > 7 && n <= 30).length
  const ok = all.filter(n => n > 30).length

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const table = tab === 'v' ? 'vehicle_compliance' : 'driver_compliance'
    const { error } = await supabase.from(table).insert(f)
    if (error) return setErr(error.message)
    setF({ compliance_type: tab === 'v' ? 'insurance' : 'driving_licence', alert_days_before: 30 }); load()
  }
  const switchTab = (t: 'v' | 'd') => { setTab(t); setF({ compliance_type: t === 'v' ? 'insurance' : 'driving_licence', alert_days_before: 30 }) }
  const Days = ({ d }: { d: string }) => { const n = daysLeft(d); return <span className={`badge ${daysClass(n)}`}>{n <= 0 ? 'Expired' : `${n} days`}</span> }
  const rows = tab === 'v' ? vc : dc

  return (<>
    <h1>Compliance & Insurance</h1>
    <div className="cards">
      <div className="card" style={{ borderTop: '4px solid #dc2626' }}>Expired<b>{expired}</b></div>
      <div className="card" style={{ borderTop: '4px solid #ea580c' }}>Due this week<b>{week}</b></div>
      <div className="card" style={{ borderTop: '4px solid #d97706' }}>Due this month<b>{month}</b></div>
      <div className="card" style={{ borderTop: '4px solid #16a34a' }}>All active<b>{ok}</b></div>
    </div>
    <div className="tabs" style={{ marginBottom: 10 }}>
      <button className={tab === 'v' ? 'on' : ''} onClick={() => switchTab('v')}>Vehicle Compliance</button>
      <button className={tab === 'd' ? 'on' : ''} onClick={() => switchTab('d')}>Driver Compliance</button>
    </div>
    <form className="grid" onSubmit={save}>
      {tab === 'v'
        ? <select required value={f.vehicle_id ?? ''} onChange={e => setF({ ...f, vehicle_id: e.target.value })}><option value="">Vehicle…</option>{trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}</select>
        : <select required value={f.driver_id ?? ''} onChange={e => setF({ ...f, driver_id: e.target.value })}><option value="">Driver…</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select>}
      <select value={f.compliance_type} onChange={e => setF({ ...f, compliance_type: e.target.value })}>{(tab === 'v' ? VT : DT).map(t => <option key={t}>{t}</option>)}</select>
      <input placeholder={tab === 'v' ? 'Policy/Cert No' : 'Document No'} onChange={e => setF({ ...f, [tab === 'v' ? 'policy_or_cert_number' : 'document_number']: e.target.value })} />
      {tab === 'v' && <input placeholder="Insurer/Authority" onChange={e => setF({ ...f, insurer_or_authority: e.target.value })} />}
      <input type="date" title="Issue date" onChange={e => setF({ ...f, issue_date: e.target.value || null })} />
      <input type="date" required title="Expiry date" onChange={e => setF({ ...f, expiry_date: e.target.value })} />
      <input type="number" placeholder="Alert days (30)" onChange={e => setF({ ...f, alert_days_before: Number(e.target.value) || 30 })} />
      {tab === 'v' && <input type="number" placeholder="Renewal cost (KES)" onChange={e => setF({ ...f, renewal_cost: e.target.value || null })} />}
      <button className="pri">Add</button>{err && <small style={{ color: 'crimson' }}>{err}</small>}
    </form>
    <table><thead><tr><th>{tab === 'v' ? 'Plate' : 'Driver'}</th><th>Type</th><th>Doc No</th><th>Expiry</th><th>Days Remaining</th><th>Status</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.id}>
        <td>{tab === 'v' ? r.vehicles?.plate : r.drivers?.full_name}</td><td>{r.compliance_type}</td>
        <td>{r.policy_or_cert_number ?? r.document_number ?? '-'}</td><td>{r.expiry_date}</td><td><Days d={r.expiry_date} /></td><td>{r.status}</td></tr>)}</tbody></table>
  </>)
}
