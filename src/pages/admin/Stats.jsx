import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { db } from '../../firebase'
import { useProducts } from '../../utils/useProducts.js'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function Stats() {
  const { products } = useProducts()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSales(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          }
        })
      )
      setLoading(false)
    })
    return unsub
  }, [])

  const today = startOfDay(new Date())
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 29)

  const totals = useMemo(() => {
    let hoy = 0, semana = 0, mes = 0
    for (const s of sales) {
      if (s.createdAt >= today) hoy += s.total
      if (s.createdAt >= weekAgo) semana += s.total
      if (s.createdAt >= monthAgo) mes += s.total
    }
    return { hoy, semana, mes }
  }, [sales])

  const chartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push({ date: d, label: d.toLocaleDateString('es-MX', { weekday: 'short' }), total: 0 })
    }
    for (const s of sales) {
      if (s.createdAt < weekAgo) continue
      const day = days.find((x) => startOfDay(x.date).getTime() === startOfDay(s.createdAt).getTime())
      if (day) day.total += s.total
    }
    return days
  }, [sales])

  const topProducts = useMemo(() => {
    const counts = {}
    for (const s of sales) {
      if (s.createdAt < monthAgo) continue
      for (const item of s.items || []) {
        counts[item.name] = (counts[item.name] || 0) + item.qty
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [sales])

  const lowStock = products.filter((p) => (p.stock ?? 0) <= (p.lowStock ?? 0))

  return (
    <div className="page">
      <h1>Estadísticas</h1>
      {loading && <p className="muted">Cargando…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="muted">Hoy</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            {currency.format(totals.hoy)}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="muted">7 días</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            {currency.format(totals.semana)}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="muted">30 días</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            {currency.format(totals.mes)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Ventas de los últimos 7 días</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="label" stroke="var(--ink-soft)" />
              <YAxis stroke="var(--ink-soft)" />
              <Tooltip formatter={(v) => currency.format(v)} />
              <Bar dataKey="total" fill="var(--ledger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Productos más vendidos (30 días)</h3>
        {topProducts.length === 0 && <p className="muted">Todavía no hay ventas suficientes.</p>}
        {topProducts.map(([name, qty], i) => (
          <div key={name} className="row-between" style={{ padding: '8px 0' }}>
            <span>{i + 1}. {name}</span>
            <strong>{qty} vendidos</strong>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Alertas de stock bajo</h3>
        {lowStock.length === 0 && <p className="muted">Todo el inventario está en niveles saludables.</p>}
        {lowStock.map((p) => (
          <div key={p.id} className="row-between" style={{ padding: '8px 0' }}>
            <span>{p.name}</span>
            <span className="stock-low">Quedan {p.stock}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
