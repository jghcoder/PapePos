import { useMemo, useState } from 'react'
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useProducts } from '../utils/useProducts.js'
import QRScanner from '../components/QRScanner.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import Cart from '../components/Cart.jsx'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function POS() {
  const { products } = useProducts()
  const [cart, setCart] = useState([])
  const [manualCode, setManualCode] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error' | 'success', text }
  const [payment, setPayment] = useState('efectivo')
  const [charging, setCharging] = useState(false)

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart])

  function findProduct(rawCode) {
    const code = rawCode.trim().toUpperCase()
    return products.find((p) => p.id.toUpperCase() === code || (p.code || '').toUpperCase() === code)
  }

  function addToCart(rawCode) {
    const product = findProduct(rawCode)
    if (!product) {
      flash('error', `No se encontró ningún producto con el código "${rawCode}".`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      const currentQty = existing ? existing.qty : 0
      const stock = product.stock ?? 0

      if (currentQty + 1 > stock) {
        flash('error', `Sin existencias suficientes de "${product.name}" (quedan ${stock}).`)
        return prev
      }

      flash('success', `Agregado: ${product.name}`)

      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function changeQty(productId, qty) {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    const product = products.find((p) => p.id === productId)
    if (product && qty > (product.stock ?? 0)) {
      flash('error', `Sólo quedan ${product.stock} unidades de "${product.name}".`)
      return
    }
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty } : i)))
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function flash(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualCode.trim()) return
    addToCart(manualCode)
    setManualCode('')
  }

  async function handleCheckout() {
    if (cart.length === 0) return
    setCharging(true)
    try {
      await addDoc(collection(db, 'sales'), {
        items: cart.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        total,
        paymentMethod: payment,
        createdAt: serverTimestamp()
      })

      await Promise.all(
        cart.map((i) => updateDoc(doc(db, 'products', i.productId), { stock: increment(-i.qty) }))
      )

      flash('success', `Venta registrada por ${currency.format(total)}`)
      setCart([])
    } catch (err) {
      flash('error', 'No se pudo registrar la venta. Se reintentará automáticamente.')
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="page">
      <h1>Nueva venta</h1>

      {message && (
        <p
          style={{
            fontWeight: 700,
            color: message.type === 'error' ? 'var(--stamp)' : 'var(--ledger)'
          }}
        >
          {message.text}
        </p>
      )}

      <QRScanner onScan={addToCart} />

      <div style={{ height: 14 }} />

      <VoiceInput onResult={addToCart} />

      <div style={{ height: 14 }} />

      <form className="card" onSubmit={handleManualSubmit}>
        <label htmlFor="manual-code">Escribir código manualmente</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="manual-code"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ej. LAP-001"
          />
          <button type="submit" className="btn-secondary">Agregar</button>
        </div>
      </form>

      <h2 style={{ marginTop: 24 }}>Carrito</h2>
      <Cart items={cart} onChangeQty={changeQty} onRemove={removeItem} />

      <div className="card" style={{ marginTop: 14 }}>
        <label htmlFor="payment">Forma de pago</label>
        <select id="payment" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro (transferencia, etc.)</option>
        </select>
      </div>

      <div className="total-bar">
        <span>Total</span>
        <span className="amount">{currency.format(total)}</span>
      </div>

      <button
        className="btn-primary btn-block"
        style={{ marginTop: 14, fontSize: '1.3rem' }}
        onClick={handleCheckout}
        disabled={cart.length === 0 || charging}
      >
        {charging ? 'Cobrando…' : 'Cobrar'}
      </button>
    </div>
  )
}
