import { useMemo, useState } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useProducts } from '../../utils/useProducts.js'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const empty = { code: '', name: '', price: '', stock: '', lowStock: '5', category: '' }

function ProductCard({ p, onEdit, onDelete }) {
  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row-between">
        <div>
          <div style={{ fontWeight: 700 }}>{p.name}</div>
          <div className="muted">
            {p.id} · {currency.format(p.price)}
            {p.category && <> · {p.category}</>}
          </div>
          <div style={{ marginTop: 4 }}>
            Existencias: <strong>{p.stock}</strong>
            {p.stock <= (p.lowStock ?? 0) && (
              <span className="stock-low" style={{ marginLeft: 8 }}>Stock bajo</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-secondary" onClick={() => onEdit(p)}>Editar</button>
          <button className="btn-danger" onClick={() => onDelete(p.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { products, loading } = useProducts()
  const [tab, setTab] = useState('alta') // 'alta' | 'buscar'
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      code: product.id,
      name: product.name || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      lowStock: product.lowStock ?? 5,
      category: product.category || ''
    })
    setTab('alta')
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
    setMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (!code || !form.name.trim() || form.price === '') {
      setMessage('Completa al menos el código, nombre y precio.')
      return
    }

    const data = {
      code,
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      lowStock: Number(form.lowStock) || 0,
      category: form.category.trim()
    }

    try {
      // El ID del documento es el código: así el QR sólo necesita contener el código.
      await setDoc(doc(db, 'products', code), data, { merge: true })
      setMessage(editingId ? 'Producto actualizado.' : 'Producto agregado.')
      resetForm()
    } catch (err) {
      setMessage('No se pudo guardar. Si estás sin internet, se guardará al reconectar.')
      resetForm()
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteDoc(doc(db, 'products', id))
  }

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase()
      const category = p.category || ''
      const code = (p.id || '').toLowerCase()

      const matchesCategory = !categoryFilter || category === categoryFilter
      const matchesSearch =
        !q || name.includes(q) || category.toLowerCase().includes(q) || code.includes(q)

      return matchesCategory && matchesSearch
    })
  }, [products, search, categoryFilter])

  return (
    <div className="page">
      <h1>Productos</h1>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'alta'}
          className={tab === 'alta' ? 'active' : ''}
          onClick={() => setTab('alta')}
        >
          ➕ Alta
        </button>
        <button
          role="tab"
          aria-selected={tab === 'buscar'}
          className={tab === 'buscar' ? 'active' : ''}
          onClick={() => setTab('buscar')}
        >
          🔍 Buscar
        </button>
      </div>

      {tab === 'alta' && (
        <form className="card" onSubmit={handleSubmit}>
          <h3>{editingId ? `Editando: ${editingId}` : 'Agregar producto'}</h3>

          <label htmlFor="code">Código (SKU) — se usará para generar el QR</label>
          <input
            id="code"
            type="text"
            value={form.code}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Ej. LAP-001"
          />

          <label htmlFor="name">Nombre del producto</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Lápiz del número 2"
          />

          <label htmlFor="price">Precio</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />

          <label htmlFor="stock">Existencias</label>
          <input
            id="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
          />

          <label htmlFor="lowStock">Avisar cuando queden menos de</label>
          <input
            id="lowStock"
            type="number"
            min="0"
            value={form.lowStock}
            onChange={(e) => setForm((f) => ({ ...f, lowStock: e.target.value }))}
          />

          <label htmlFor="category">Categoría (opcional)</label>
          <input
            id="category"
            type="text"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Ej. Escritura"
          />

          {message && <p style={{ fontWeight: 700, color: 'var(--ledger)' }}>{message}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {editingId ? 'Guardar cambios' : 'Agregar producto'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {tab === 'buscar' && (
        <>
          <div className="card">
            <label htmlFor="search">Buscar por nombre, categoría o código</label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. lápiz, escritura, LAP-001…"
              autoFocus
            />

            <label htmlFor="categoryFilter">Filtrar por categoría</label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <h2 style={{ marginTop: 24 }}>
            {search || categoryFilter ? `Resultados (${results.length})` : `Catálogo (${products.length})`}
          </h2>
          {loading && <p className="muted">Cargando…</p>}
          {!loading && results.length === 0 && (
            <p className="muted">No se encontraron productos.</p>
          )}

          {results.map((p) => (
            <ProductCard key={p.id} p={p} onEdit={startEdit} onDelete={handleDelete} />
          ))}
        </>
      )}
    </div>
  )
}
