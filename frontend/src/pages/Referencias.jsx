import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const EMPTY = {
  codigo: '', tipo: 'bolsa', materiaPrima: '',
  dimensiones: { ancho: '', largo: '', calibre: '', unidad: 'cm' },
  conImpresion: false, destino: 'externo', descripcion: '',
  procesos: { extrusion: true, impresionRefilado: false, sellado: true },
}

function Badge({ estado }) {
  const map = { bolsa: 'badge-produccion', rollo: 'badge-espera', lamina: 'badge-completado' }
  const labels = { bolsa: 'Bolsa', rollo: 'Rollo', lamina: 'Lámina' }
  return <span className={`badge ${map[estado] || ''}`}>{labels[estado] || estado}</span>
}

export default function Referencias() {
  const [refs, setRefs]         = useState([])
  const [form, setForm]         = useState(EMPTY)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')

  const { puede } = useAuth()
  const canEdit = puede('editarReferencias')

  const load = async () => {
    setLoading(true)
    try {
      const params = filtroTipo ? { tipo: filtroTipo } : {}
      const { data } = await axios.get('/api/referencias', { params })
      setRefs(data)
    } catch {
      setError('Error al cargar referencias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtroTipo])

  const parseNumeric = (value) => value === '' ? '' : Number(value)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('dim.')) {
      const key = name.split('.')[1]
      setForm(f => ({ ...f, dimensiones: { ...f.dimensiones, [key]: parseNumeric(value) } }))
    } else if (name.startsWith('proc.')) {
      const key = name.split('.')[1]
      setForm(f => ({ ...f, procesos: { ...f.procesos, [key]: checked } }))
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const payload = {
      ...form,
      dimensiones: {
        ancho: form.dimensiones.ancho === '' ? undefined : Number(form.dimensiones.ancho),
        largo: form.dimensiones.largo === '' ? undefined : Number(form.dimensiones.largo),
        calibre: form.dimensiones.calibre === '' ? undefined : Number(form.dimensiones.calibre),
        unidad: form.dimensiones.unidad,
      },
    }
    try {
      if (editing) {
        await axios.put(`/api/referencias/${editing}`, payload)
        setSuccess('Referencia actualizada correctamente')
      } else {
        await axios.post('/api/referencias', payload)
        setSuccess('Referencia creada correctamente')
      }
      setForm(EMPTY); setEditing(null); setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleEdit = (ref) => {
    setForm({
      codigo: ref.codigo, tipo: ref.tipo, materiaPrima: ref.materiaPrima,
      dimensiones: { ...ref.dimensiones },
      conImpresion: ref.conImpresion, destino: ref.destino,
      descripcion: ref.descripcion || '',
      procesos: { ...ref.procesos },
    })
    setEditing(ref._id); setShowForm(true); setError(''); setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar esta referencia?')) return
    try {
      await axios.delete(`/api/referencias/${id}`)
      setSuccess('Referencia desactivada')
      load()
    } catch {
      setError('Error al desactivar')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Referencias <span>de producto</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ width: 160 }}>
            <option value="">Todos los tipos</option>
            <option value="bolsa">Bolsa</option>
            <option value="rollo">Rollo</option>
            <option value="lamina">Lámina</option>
          </select>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => {
              setForm(EMPTY); setEditing(null); setShowForm(!showForm)
            }}>
              {showForm ? '✕ Cerrar' : '+ Nueva referencia'}
            </button>
          )}
        </div>
      </div>

      {error   && <div className="error-msg"><span>⚠</span> {error}</div>}
      {success && <div className="success-msg"><span>✓</span> {success}</div>}

      {showForm && canEdit && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.15rem',
            textTransform: 'uppercase', marginBottom: 20, color: 'var(--accent)' }}>
            {editing ? '✎ Editar referencia' : '+ Nueva referencia'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-3" style={{ marginBottom: 18 }}>
              <div>
                <label>Código *</label>
                <input name="codigo" value={form.codigo} onChange={handleChange} required placeholder="REF-001" />
              </div>
              <div>
                <label>Tipo *</label>
                <select name="tipo" value={form.tipo} onChange={handleChange}>
                  <option value="bolsa">Bolsa</option>
                  <option value="rollo">Rollo</option>
                  <option value="lamina">Lámina</option>
                </select>
              </div>
              <div>
                <label>Materia prima *</label>
                <input name="materiaPrima" value={form.materiaPrima} onChange={handleChange} required placeholder="Polietileno HD" />
              </div>
            </div>

            <div className="form-grid form-grid-3" style={{ marginBottom: 18 }}>
              <div>
                <label>Ancho ({form.dimensiones.unidad}) *</label>
                <input name="dim.ancho" type="text" inputMode="decimal"
                  value={form.dimensiones.ancho} onChange={handleChange} required placeholder="Ej. 25" />
              </div>
              <div>
                <label>Largo ({form.dimensiones.unidad}) *</label>
                <input name="dim.largo" type="text" inputMode="decimal"
                  value={form.dimensiones.largo} onChange={handleChange} required placeholder="Ej. 30" />
              </div>
              <div>
                <label>Calibre (micras)</label>
                <input name="dim.calibre" type="text" inputMode="decimal"
                  value={form.dimensiones.calibre} onChange={handleChange} placeholder="Ej. 100" />
              </div>
            </div>

            <div className="form-grid form-grid-3" style={{ marginBottom: 18 }}>
              <div>
                <label>Destino *</label>
                <select name="destino" value={form.destino} onChange={handleChange}>
                  <option value="externo">Cliente externo</option>
                  <option value="interno">Consumo interno</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ marginBottom: 8 }}>Con impresión (logo)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none',
                  fontSize: '.9rem', color: 'var(--text)', letterSpacing: 0 }}>
                  <input type="checkbox" name="conImpresion" checked={form.conImpresion}
                    onChange={handleChange} style={{ width: 'auto' }} />
                  Lleva impresión
                </label>
              </div>
              <div>
                <label>Descripción</label>
                <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Opcional" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 12 }}>Procesos que aplican</label>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  ['extrusion', 'Extrusión (obligatorio)'],
                  ['impresionRefilado', 'Impresión / Refilado'],
                  ['sellado', 'Sellado'],
                ].map(([key, lbl]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8,
                    textTransform: 'none', fontSize: '.9rem', color: 'var(--text)', letterSpacing: 0 }}>
                    <input type="checkbox" name={`proc.${key}`}
                      checked={form.procesos[key]} onChange={handleChange}
                      disabled={key === 'extrusion'}
                      style={{ width: 'auto' }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit">
                {editing ? '✓ Guardar cambios' : '+ Crear referencia'}
              </button>
              <button className="btn btn-ghost" type="button"
                onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY) }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <div className="loading-text">Cargando...</div>
          </div>
        ) : refs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            No hay referencias{filtroTipo ? ` de tipo "${filtroTipo}"` : ''}.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Tipo</th><th>Materia prima</th>
                  <th>Dimensiones</th><th>Impresión</th><th>Destino</th>
                  <th>Procesos</th>{canEdit && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {refs.map(r => (
                  <tr key={r._id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700,
                        color: 'var(--accent)', fontSize: '1.05rem' }}>{r.codigo}</span>
                    </td>
                    <td><Badge estado={r.tipo} /></td>
                    <td style={{ color: 'var(--text2)' }}>{r.materiaPrima}</td>
                    <td style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                      {r.dimensiones.ancho}×{r.dimensiones.largo} {r.dimensiones.unidad}
                      {r.dimensiones.calibre ? ` · ${r.dimensiones.calibre}µ` : ''}
                    </td>
                    <td>
                      <span style={{ color: r.conImpresion ? 'var(--success)' : 'var(--text3)', fontSize: '.88rem' }}>
                        {r.conImpresion ? '✓ Sí' : '— No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.destino === 'externo' ? 'badge-produccion' : 'badge-espera'}`}>
                        {r.destino === 'externo' ? 'Externo' : 'Interno'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--text3)' }}>
                      {[
                        r.procesos?.extrusion && 'Extrus.',
                        r.procesos?.impresionRefilado && 'Impres.',
                        r.procesos?.sellado && 'Sellado',
                      ].filter(Boolean).join(' · ')}
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>✎</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
