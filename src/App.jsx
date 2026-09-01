import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useOnline } from './context/OnlineContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import Header from './components/Header.jsx'
import Login from './pages/Login.jsx'
import POS from './pages/POS.jsx'
import Products from './pages/admin/Products.jsx'
import GenerateQR from './pages/admin/GenerateQR.jsx'
import Stats from './pages/admin/Stats.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (user === undefined) {
    return <div className="page">Cargando…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const online = useOnline()

  return (
    <div className="app-shell">
      {user && <Header />}
      {!online && (
        <div className="offline-banner">
          Sin conexión — las ventas se guardan en el dispositivo y se sincronizarán al recuperar internet
        </div>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <POS />
            </RequireAuth>
          }
        />
        <Route
          path="/productos"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />
        <Route
          path="/etiquetas"
          element={
            <RequireAuth>
              <GenerateQR />
            </RequireAuth>
          }
        />
        <Route
          path="/estadisticas"
          element={
            <RequireAuth>
              <Stats />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <BottomNav />}
    </div>
  )
}
