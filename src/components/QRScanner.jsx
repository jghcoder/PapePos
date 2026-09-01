import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const REGION_ID = 'qr-reader-region'
const SCAN_COOLDOWN_MS = 1500 // evita registrar el mismo código dos veces por accidente

export default function QRScanner({ onScan }) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ code: '', time: 0 })

  useEffect(() => {
    if (!active) return

    const scanner = new Html5Qrcode(REGION_ID)
    scannerRef.current = scanner
    setError('')

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const now = Date.now()
          const last = lastScanRef.current
          if (decodedText === last.code && now - last.time < SCAN_COOLDOWN_MS) return
          lastScanRef.current = { code: decodedText, time: now }
          if (navigator.vibrate) navigator.vibrate(80)
          onScan(decodedText)
        },
        () => {
          /* ignorar errores de frames sin QR visible */
        }
      )
      .catch(() => {
        setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
        setActive(false)
      })

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
    }
  }, [active])

  return (
    <div className="card">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>Escanear producto</h3>
        <button
          className={active ? 'btn-danger' : 'btn-primary'}
          onClick={() => setActive((a) => !a)}
        >
          {active ? 'Detener cámara' : '📷 Activar cámara'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--stamp)', fontWeight: 700 }}>{error}</p>}

      {active && (
        <div
          id={REGION_ID}
          style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', minHeight: 240 }}
        />
      )}
    </div>
  )
}
