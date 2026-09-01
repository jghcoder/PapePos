import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useProducts } from '../../utils/useProducts.js'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function Label({ product }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, product.id, { width: 140, margin: 1 })
    }
  }, [product.id])

  function download() {
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${product.id}.png`
    a.click()
  }

  return (
    <div className="card label-print" style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} />
      <div style={{ fontWeight: 700, marginTop: 6 }}>{product.name}</div>
      <div className="muted">{product.id} · {currency.format(product.price)}</div>
      <button className="btn-secondary" style={{ marginTop: 10 }} onClick={download}>
        Descargar PNG
      </button>
    </div>
  )
}

export default function GenerateQR() {
  const { products } = useProducts()
  const [selected, setSelected] = useState(() => new Set())

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(products.map((p) => p.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const toShow = selected.size > 0 ? products.filter((p) => selected.has(p.id)) : []

  return (
    <div className="page">
      <h1>Etiquetas QR</h1>
      <p className="muted">
        Elige los productos y genera sus etiquetas. Puedes descargarlas una por una o mandar
        a imprimir la hoja completa desde el botón de imprimir de tu navegador.
      </p>

      <div className="card no-print">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>Selecciona productos</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={selectAll}>Todos</button>
            <button className="btn-secondary" onClick={clearSelection}>Ninguno</button>
          </div>
        </div>

        <div style={{ marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>
          {products.map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid var(--line)',
                fontWeight: 400
              }}
            >
              <input
                type="checkbox"
                style={{ width: 22, height: 22 }}
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span>{p.name} <span className="muted">({p.id})</span></span>
            </label>
          ))}
        </div>
      </div>

      {toShow.length > 0 && (
        <>
          <div className="row-between no-print" style={{ marginTop: 20 }}>
            <h2 style={{ margin: 0 }}>Etiquetas ({toShow.length})</h2>
            <button className="btn-primary" onClick={() => window.print()}>🖨 Imprimir hoja</button>
          </div>

          <div
            id="labels-sheet"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 12
            }}
          >
            {toShow.map((p) => (
              <Label key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      <style>{`
        @media print {
          .bottom-nav, .offline-banner, form, h1, p.muted, .no-print { display: none !important; }
          #labels-sheet { grid-template-columns: repeat(3, 1fr) !important; }
          .label-print { break-inside: avoid; box-shadow: none !important; border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  )
}
