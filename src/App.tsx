import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import Login from './pages/Login'
import Tyres from './pages/Tyres'
import Compliance from './pages/Compliance'

type Role = 'corporate_admin' | 'manager' | 'staff'
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role>('staff')
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState('tyres')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => data && setRole(data.role as Role))
  }, [session])

  if (!ready) return <p style={{ padding: 24 }}>Loading…</p>
  if (!session) return <Login />
  const canCompliance = role === 'manager' || role === 'corporate_admin'
  return (
    <div className="layout">
      <aside className="side">
        <h2>TransportHub</h2>
        <button className={page === 'tyres' ? 'on' : ''} onClick={() => setPage('tyres')}>Tyres</button>
        {canCompliance && <button className={page === 'compliance' ? 'on' : ''} onClick={() => setPage('compliance')}>Compliance</button>}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </aside>
      <main className="main">
        {page === 'tyres' && <Tyres />}
        {page === 'compliance' && canCompliance && <Compliance />}
      </main>
    </div>
  )
}
