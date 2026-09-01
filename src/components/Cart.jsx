const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function Cart({ items, onChangeQty, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="receipt" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
        Aún no has agregado productos.<br />
        Escanea un QR, dicta el código o escríbelo abajo.
      </div>
    )
  }

  return (
    <div className="receipt">
      {items.map((item) => (
        <div
          key={item.productId}
          className="row-between"
          style={{ padding: '10px 0', borderBottom: '1px dashed var(--line)' }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div className="muted">{currency.format(item.price)} c/u</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ minHeight: 44, minWidth: 44, padding: 0 }}
              aria-label={`Quitar una unidad de ${item.name}`}
              onClick={() => onChangeQty(item.productId, item.qty - 1)}
            >
              −
            </button>
            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
            <button
              className="btn-secondary"
              style={{ minHeight: 44, minWidth: 44, padding: 0 }}
              aria-label={`Agregar una unidad de ${item.name}`}
              onClick={() => onChangeQty(item.productId, item.qty + 1)}
            >
              +
            </button>
            <button
              className="btn-danger"
              style={{ minHeight: 44, padding: '0 12px' }}
              aria-label={`Quitar ${item.name} del carrito`}
              onClick={() => onRemove(item.productId)}
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
