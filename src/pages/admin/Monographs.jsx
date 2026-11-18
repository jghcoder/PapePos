import { useMemo, useState, useRef } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../firebase'
import { useMonographs } from '../../utils/useMonographs.js'

const empty = { idNumber: '', name: '', category: '', location: '', photoURL: '' }

function MonographCard({ m, onEdit, onDelete }) {
  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row-between">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {m.photoURL && (
            <img
              src={m.photoURL}
              alt={m.name}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div className="muted">
              ID: {m.idNumber}
              {m.category && <> · {m.category}</>}
              {m.location && <> · {m.location}</>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-secondary" onClick={() => onEdit(m)}>Editar</button>
          <button className="btn-danger" onClick={() => onDelete(m.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function Monographs() {
  const { monographs, loading } = useMonographs()
  const [tab, setTab] = useState('alta')
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  function startEdit(monograph) {
    setEditingId(monograph.id)
    setForm({
      idNumber: monograph.idNumber,
      name: monograph.name || '',
      category: monograph.category || '',
      location: monograph.location || '',
      photoURL: monograph.photoURL || ''
    })
    setPhotoFile(null)
    setTab('alta')
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
    setPhotoFile(null)
    setMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('El archivo debe ser una imagen.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage('La imagen no debe superar 5 MB.')
        return
      }
      setPhotoFile(file)
      setMessage('')
    }
  }

  async function uploadPhoto(file, code) {
    const storageRef = ref(storage, `monographs/${code}/${file.name}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  async function deletePhoto(photoURL) {
    try {
      const photoRef = ref(storage, photoURL)
      await deleteObject(photoRef)
    } catch (err) {
      console.warn('No se pudo eliminar la foto anterior:', err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const idNumber = form.idNumber.trim().toUpperCase()
    if (!idNumber || !form.name.trim()) {
      setMessage('Completa al menos el número de identificación y el nombre.')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      let photoURL = form.photoURL

      if (photoFile) {
        if (form.photoURL && editingId) {
          await deletePhoto(form.photoURL)
        }
        photoURL = await uploadPhoto(photoFile, idNumber)
      }

      const data = {
        idNumber,
        name: form.name.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        photoURL: photoURL || ''
      }

      await setDoc(doc(db, 'monographs', idNumber), data, { merge: true })
      setMessage(editingId ? 'Monografía actualizada.' : 'Monografía agregada.')
      resetForm()
    } catch (err) {
      setMessage('No se pudo guardar. Si estás sin internet, se guardará al reconectar.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta monografía?')) return
    const monograph = monographs.find((m) => m.id === id)
    if (monograph?.photoURL) {
      await deletePhoto(monograph.photoURL)
    }
    await deleteDoc(doc(db, 'monographs', id))
  }

  const categories = useMemo(() => {
    const set = new Set(monographs.map((m) => m.category).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [monographs])

  const locations = useMemo(() => {
    const set = new Set(monographs.map((m) => m.location).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [monographs])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    return monographs.filter((m) => {
      const name = (m.name || '').toLowerCase()
      const category = m.category || ''
      const location = m.location || ''
      const idNum = (m.idNumber || '').toLowerCase()

      const matchesCategory = !categoryFilter || category === categoryFilter
      const matchesSearch =
        !q ||
        name.includes(q) ||
        category.toLowerCase().includes(q) ||
        location.toLowerCase().includes(q) ||
        idNum.includes(q)

      return matchesCategory && matchesSearch
    })
  }, [monographs, search, categoryFilter])

  return (
    <div className="page">
      <h1>Monografías Clasificadas</h1>

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
          <h3>{editingId ? `Editando: ${editingId}` : 'Agregar monografía'}</h3>

          <label htmlFor="idNumber">Número de identificación (ID)</label>
          <input
            id="idNumber"
            type="text"
            value={form.idNumber}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
            placeholder="Ej. MON-001"
          />

          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Monografía de Historia"
          />

          <label htmlFor="category">Categoría (opcional)</label>
          <input
            id="category"
            type="text"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Ej. Historia, Ciencia, Literatura"
            list="categories"
          />
          <datalist id="categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>

          <label htmlFor="location">Ubicación (opcional)</label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Ej. Estante A-3, Biblioteca Central"
            list="locations"
          />
          <datalist id="locations">
            {locations.map((l) => <option key={l} value={l} />)}
          </datalist>

          <label htmlFor="photo">Foto (opcional, máx. 5 MB)</label>
          <input
            id="photo"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
          {photoFile && (
            <div style={{ marginTop: 8 }}>
              <img
                src={URL.createObjectURL(photoFile)}
                alt="Vista previa"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
            </div>
          )}
          {form.photoURL && !photoFile && (
            <div style={{ marginTop: 8 }}>
              <img
                src={form.photoURL}
                alt="Foto actual"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
              <p className="muted" style={{ marginTop: 4 }}>Foto actual (se reemplazará si subes una nueva)</p>
            </div>
          )}

          {message && <p style={{ fontWeight: 700, color: 'var(--ledger)' }}>{message}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={uploading}>
              {uploading ? 'Subiendo…' : editingId ? 'Guardar cambios' : 'Agregar monografía'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={uploading}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {tab === 'buscar' && (
        <>
          <div className="card">
            <label htmlFor="search">Buscar por nombre, categoría, ubicación o ID</label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. historia, estante A, MON-001…"
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
            {search || categoryFilter ? `Resultados (${results.length})` : `Catálogo (${monographs.length})`}
          </h2>
          {loading && <p className="muted">Cargando…</p>}
          {!loading && results.length === 0 && (
            <p className="muted">No se encontraron monografías.</p>
          )}

          {results.map((m) => (
            <MonographCard key={m.id} m={m} onEdit={startEdit} onDelete={handleDelete} />
          ))}
        </>
      )}
    </div>
  )
}