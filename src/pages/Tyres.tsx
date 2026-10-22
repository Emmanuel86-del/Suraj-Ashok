import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const BADGE: Record<string, string> = { in_store: 'green', in_use: 'blue', worn_out: 'amber', punctured: 'orange', retired: 'red' }
const POSITIONS = ['FL', 'FR', 'RL', 'RR', 'RL2', 'RR2', 'spare']
const blank = { tyre_id: '', brand: '', size: '', serial_number: '', type: 'new', status: 'in_store', current_truck_id: '', position: '', fitted_date: '', km_at_fitting: '', cost: '', supplier: '' }

export default function Tyres() {
  const [rows, setRows] = useState<any[]>([]); const [trucks, setTrucks] = useState<any[]>([])
  const [tab, setTab] = useState<'in_use' | 'in_store'>('in_use'); const [q, setQ] = useState('')
  const [f, setF] = useState<any>(blank); const [err, setErr] = useState('')

  const load = async () => {
    const t = await supabase.from('tyres').select('*, vehicles(plate)').order('created_at', { ascending: false })
    setRows(t.data ?? [])
    const v = await supabase.from('vehicles').select('id, plate'); setTrucks(v.data ?? [])
  }
  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]))
    const { data, error } = await supabase.from('tyres').insert(clean).select().single()
    if (error) return setErr(error.message)
    if (f.status === 'in_use' && data)
      await supabase.from('tyre_history').insert({ tyre_id: data.id, truck_id: data.current_truck_id, action: 'fitted', position: data.position, km_at_action: data.km_at_fitting })
    setF(blank); load()
  }

  const shown = rows.filter(r => r.status === tab && `${r.tyre_id} ${r.brand} ${r.size}`.toLowerCase().includes(q.toLowerCase()))
  const month = new Date().toISOString().slice(0, 7)
  const cnt = (s: string[]) => rows.filter(r => s.includes(r.status)).length
  const monthCost = rows.filter(r => r.created_at?.startsWith(month)).reduce((a, r) => a + Number(r.cost || 0), 0)

  return (<>
    <h1>Tyre Management</h1>
    <div className="cards">
      <div className="card">Total<b>{rows.length}</b></div><div className="card">In Use<b>{cnt(['in_use'])}</b></div>
      <div className="card">In Store<b>{cnt(['in_store'])}</b></div><div className="card">Worn/Retired<b>{cnt(['worn_out', 'retired'])}</b></div>
      <div className="card">Cost this month<b>{monthCost.toLocaleString()}</b></div>
    </div>
    <form className="grid" onSubmit={save}>
      <input placeholder="Tyre ID *" required value={f.tyre_id} onChange={e => setF({ ...f, tyre_id: e.target.value })} />
      <input placeholder="Brand *" required value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })} />
      <input placeholder="Size *" required value={f.size} onChange={e => setF({ ...f, size: e.target.value })} />
      <input placeholder="Serial No" value={f.serial_number} onChange={e => setF({ ...f, serial_number: e.target.value })} />
      <select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="new">New</option><option value="retreaded">Retreaded</option><option value="second_hand">Second-hand</option></select>
      <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{Object.keys(BADGE).map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select value={f.current_truck_id} onChange={e => setF({ ...f, current_truck_id: e.target.value })}><option value="">Truck…</option>{trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}</select>
      <select value={f.position} onChange={e => setF({ ...f, position: e.target.value })}><option value="">Position…</option>{POSITIONS.map(p => <option key={p}>{p}</option>)}</select>
      <input type="date" value={f.fitted_date} onChange={e => setF({ ...f, fitted_date: e.target.value })} />
      <input type="number" placeholder="KM at fitting" value={f.km_at_fitting} onChange={e => setF({ ...f, km_at_fitting: e.target.value })} />
      <input type="number" placeholder="Cost (KES)" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} />
      <input placeholder="Supplier" value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} />
      <button className="pri">Add tyre</button>{err && <small style={{ color: 'crimson' }}>{err}</small>}
    </form>
    <div className="tabs" style={{ marginBottom: 10 }}>
      <button className={tab === 'in_use' ? 'on' : ''} onClick={() => setTab('in_use')}>Active Tyres</button>
      <button className={tab === 'in_store' ? 'on' : ''} onClick={() => setTab('in_store')}>Store Inventory</button>
      <input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
    </div>
    <table><thead><tr><th>Tyre ID</th><th>Brand</th><th>Size</th><th>Type</th><th>Status</th><th>Truck</th><th>Pos</th><th>Fitted</th><th>KM Run</th><th>Cost</th></tr></thead>
      <tbody>{shown.map(r => <tr key={r.id}><td>{r.tyre_id}</td><td>{r.brand}</td><td>{r.size}</td><td>{r.type}</td>
        <td><span className={`badge ${BADGE[r.status]}`}>{r.status}</span></td><td>{r.vehicles?.plate ?? '-'}</td><td>{r.position ?? '-'}</td>
        <td>{r.fitted_date ?? '-'}</td><td>{r.km_run ?? '-'}</td><td>{r.cost ?? '-'}</td></tr>)}</tbody></table>
  </>)
}
