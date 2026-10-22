import { useState } from 'react'
import { supabase } from '../supabase'
export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
  }
  return (
    <form className="login" onSubmit={submit}>
      <h2>Suraj Ashok Ltd — TransportHub</h2>
      <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      {err && <small style={{ color: 'crimson' }}>{err}</small>}
      <button className="pri">Sign in</button>
    </form>
  )
}
