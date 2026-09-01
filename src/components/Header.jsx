import { useAuth } from '../context/AuthContext.jsx'

export default function Header() {
  const { logout } = useAuth()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--paper)',
        borderBottom: '2px solid var(--line)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
        Papelería
      </span>
      <button
        className="btn-secondary"
        style={{ minHeight: 44, padding: '0 14px', fontSize: '0.9rem' }}
        onClick={logout}
      >
        Salir
      </button>
    </header>
  )
}
