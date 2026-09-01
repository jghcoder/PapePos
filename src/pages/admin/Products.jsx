import { useState } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useProducts } from '../../utils/useProducts.js'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const empty = { code: '', name: '', price: '', stock: '', lowStock: '5', category: '' }

export default function Products() {
  const { products, loading } = useProducts()
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

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
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
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

  return (
    <div className="page">
      <h1>Productos</h1>

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

      <h2 style={{ marginTop: 24 }}>Catálogo ({products.length})</h2>
      {loading && <p className="muted">Cargando…</p>}

      {products.map((p) => (
        <div key={p.id} className="card" style={{ marginTop: 10 }}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="muted">{p.id} · {currency.format(p.price)}</div>
              <div style={{ marginTop: 4 }}>
                Existencias: <strong>{p.stock}</strong>
                {p.stock <= (p.lowStock ?? 0) && (
                  <span className="stock-low" style={{ marginLeft: 8 }}>Stock bajo</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-secondary" onClick={() => startEdit(p)}>Editar</button>
              <button className="btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
