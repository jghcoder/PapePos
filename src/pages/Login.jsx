import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError('Correo o contraseña incorrectos. Si no tienes internet la primera vez, conéctate una vez para iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420, marginTop: 40 }}>
      <div className="card">
        <h1 style={{ textAlign: 'center' }}>Papelería</h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: -8 }}>
          Inicia sesión para comenzar a vender
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p style={{ color: 'var(--stamp)', fontWeight: 700, marginTop: 12 }}>{error}</p>
          )}

          <button type="submit" className="btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
