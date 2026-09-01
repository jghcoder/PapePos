import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Vender', icon: '🧾', end: true },
  { to: '/productos', label: 'Productos', icon: '📦' },
  { to: '/etiquetas', label: 'Etiquetas QR', icon: '🏷️' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' }
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
