import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function getBadgeOrden(estado) {
  const map = {
    pendiente: ['badge-pendiente', 'Pendiente'],
    en_proceso: ['badge-proceso', 'En proceso'],
    finalizado: ['badge-finalizado', 'Finalizado'],
  }
  const [cls, label] = map[estado] || ['', estado]
  return <span className={`badge ${cls}`}>{label}</span>
}

const EMPTY_ORDEN = {
  pedido: '', lineaPedidoId: '', referencia: '',
  selladora: 1, cantidadAsignada: 1, creadoPor: '',
  procesos: { extrusion: true, impresionRefilado: false, sellado: true },
}

const EMPTY_REPORTE = {
  operario: '', numeroRollo: '', horaInicio: '',
  horaFin: '', cantidadProducida: 0, desperdicio: 0,
  observaciones: '', finalizar: false,
}

export default function Ordenes() {
  const [ordenes, setOrdenes]       = useState([])
  const [pedidos, setPedidos]       = useState([])
  const [operarios, setOperarios]   = useState([])
  const [jefes, setJefes]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [filtroSell, setFiltroSell] = useState('')
  const [filtroEst, setFiltroEst]   = useState('')
  const [form, setForm]             = useState(EMPTY_ORDEN)
  const [reporte, setReporte]       = useState(null)
  const [repForm, setRepForm]       = useState(EMPTY_REPORTE)
  const [pedidoLineas, setPedidoLineas] = useState([])

  const { puede, usuario } = useAuth()
  const canCreate = puede('crearOrdenes')
  const canReport = puede('registrarReporte')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtroSell) params.selladora = filtroSell
      if (filtroEst)  params.estado    = filtroEst
      const [o, p, op, j] = await Promise.all([
        axios.get('/api/ordenes', { params }),
        axios.get('/api/pedidos'),
        axios.get('/api/usuarios?rol=operario'),
        axios.get('/api/usuarios?rol=jefe_produccion'),
      ])
      setOrdenes(o.data); setPedidos(p.data)
      setOperarios(op.data); setJefes(j.data)
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtroSell, filtroEst])

  const handlePedidoChange = async (pedidoId) => {
    setForm(f => ({ ...f, pedido: pedidoId, lineaPedidoId: '', referencia: '' }))
    if (!pedidoId) { setPedidoLineas([]); return }
    try {
      const { data } = await axios.get(`/api/pedidos/${pedidoId}`)
      setPedidoLineas(data.lineas || [])
    } catch { setPedidoLineas([]) }
  }

  const handleLineaChange = (lineaId) => {
    const linea = pedidoLineas.find(l => l._id === lineaId)
    setForm(f => ({
      ...f,
      lineaPedidoId: lineaId,
      referencia: linea?.referencia?._id || linea?.referencia || '',
    }))
  }

  const getAsignadaLinea = (lineaId) => {
    return ordenes.reduce((sum, orden) => {
      if (orden.lineaPedidoId === lineaId) return sum + (orden.cantidadAsignada || 0)
      return sum
    }, 0)
  }

  const parseNumeric = (value) => value === '' ? '' : Number(value)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      await axios.post('/api/ordenes', form)
      setSuccess('Orden de producción creada correctamente')
      setShowForm(false); setForm(EMPTY_ORDEN); setPedidoLineas([])
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear orden')
    }
  }

  const handleReporte = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      await axios.post(`/api/ordenes/${reporte}/reportes`, repForm)
      setSuccess('Reporte de turno registrado correctamente')
      setReporte(null); setRepForm(EMPTY_REPORTE)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar reporte')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return
    try {
      await axios.delete(`/api/ordenes/${id}`)
      setSuccess('Orden eliminada'); load()
    } catch {
      setError('Error al eliminar')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Órdenes <span>de producción</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={filtroSell} onChange={e => setFiltroSell(e.target.value)} style={{ width: 160 }}>
            <option value="">Todas las selladoras</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Selladora {n}</option>)}
          </select>
          <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} style={{ width: 150 }}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="finalizado">Finalizado</option>
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cerrar' : '+ Nueva orden'}
            </button>
          )}
        </div>
      </div>

      {error   && <div className="error-msg"><span>⚠</span> {error}</div>}
      {success && <div className="success-msg"><span>✓</span> {success}</div>}

      {showForm && canCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.15rem',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>
            + Nueva orden de producción
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label>Pedido *</label>
                <select value={form.pedido} onChange={e => handlePedidoChange(e.target.value)} required>
                  <option value="">Seleccionar pedido</option>
                  {pedidos.filter(p => p.estadoGeneral !== 'entregado').map(p => (
                    <option key={p._id} value={p._id}>
                      {p.numeroPedido} — {p.cliente || 'Interno'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Referencia del pedido *</label>
                <select value={form.lineaPedidoId} onChange={e => handleLineaChange(e.target.value)} required disabled={!form.pedido}>
                  <option value="">Seleccionar línea</option>
                  {pedidoLineas.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.referencia?.codigo || l.referencia} — Cant: {l.cantidad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid form-grid-3" style={{ marginBottom: 18 }}>
              <div>
                <label>Selladora asignada *</label>
                <select value={form.selladora} onChange={e => setForm(f => ({ ...f, selladora: Number(e.target.value) }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>Selladora {n}</option>)}
                </select>
              </div>
              <div>
                <label>Cantidad asignada *</label>
                <input type="text" inputMode="numeric" value={form.cantidadAsignada}
                  onChange={e => setForm(f => ({ ...f, cantidadAsignada: parseNumeric(e.target.value) }))} required placeholder="Cantidad" />
              </div>
              <div>
                <label>Creado por (jefe) *</label>
                <select value={form.creadoPor} onChange={e => setForm(f => ({ ...f, creadoPor: e.target.value }))} required>
                  <option value="">Seleccionar jefe</option>
                  {jefes.map(j => <option key={j._id} value={j._id}>{j.nombre}</option>)}
                </select>
              </div>
            </div>

            {form.lineaPedidoId && (
              <div style={{ marginBottom: 18, color: 'var(--text3)', fontSize: '.88rem', padding: '12px 16px', background: 'rgba(0,212,255,0.05)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.1)' }}>
                <strong>Resumen de la línea:</strong> cantidad total <strong style={{ color: 'var(--text)' }}>{pedidoLineas.find(l => l._id === form.lineaPedidoId)?.cantidad || 0}</strong>, asignada ya <strong style={{ color: 'var(--text)' }}>{getAsignadaLinea(form.lineaPedidoId)}</strong>, restante <strong style={{ color: 'var(--accent)' }}>{Math.max(0, (pedidoLineas.find(l => l._id === form.lineaPedidoId)?.cantidad || 0) - getAsignadaLinea(form.lineaPedidoId))}</strong>.
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 12 }}>Procesos de esta orden</label>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  ['extrusion', 'Extrusión (obligatorio)'],
                  ['impresionRefilado', 'Impresión / Refilado'],
                  ['sellado', 'Sellado'],
                ].map(([key, lbl]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8,
                    textTransform: 'none', fontSize: '.9rem', color: 'var(--text)', letterSpacing: 0 }}>
                    <input type="checkbox" checked={form.procesos[key]} style={{ width: 'auto' }}
                      disabled={key === 'extrusion'}
                      onChange={e => setForm(f => ({ ...f, procesos: { ...f.procesos, [key]: e.target.checked } }))} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit">✓ Crear orden</button>
              <button className="btn btn-ghost" type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_ORDEN); setPedidoLineas([]) }}>
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
        ) : ordenes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            No hay órdenes de producción.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th><th>Referencia</th><th>Selladora</th>
                  <th>Cant. asignada</th><th>Procesos</th>
                  <th>Estado</th><th>Reportes</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--accent)' }}>
                      {o.pedido?.numeroPedido || '—'}
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontWeight: 400, marginTop: 4 }}>
                        {o.pedido?.cliente || 'Interno'}
                      </div>
                      {o.pedido?.estadoGeneral && (
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 6 }}>
                          Pedido: {o.pedido.estadoGeneral.replace('_', ' ')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                      {o.referencia?.codigo || '—'}
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                        {o.referencia?.tipo}
                      </div>
                    </td>
                    <td>
                      <div style={{
                        background: 'var(--bg)', border: '1px solid var(--accent)',
                        borderRadius: 8, padding: '6px 12px', display: 'inline-block',
                        fontFamily: 'var(--font-head)', fontWeight: 700,
                        color: 'var(--accent)', fontSize: '.95rem',
                      }}>
                        S{o.selladora}
                      </div>
                    </td>
                    <td>{o.cantidadAsignada?.toLocaleString()}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text3)' }}>
                      {[
                        o.procesos?.extrusion && 'Extrus.',
                        o.procesos?.impresionRefilado && 'Impres.',
                        o.procesos?.sellado && 'Sellado',
                      ].filter(Boolean).join(' · ')}
                    </td>
                    <td>{getBadgeOrden(o.estado)}</td>
                    <td style={{ fontSize: '.85rem', color: 'var(--text3)' }}>
                      {o.reportes?.length || 0} reporte(s)
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {canReport && o.estado !== 'finalizado' && (
                          <button className="btn btn-success btn-sm"
                            onClick={() => { setReporte(o._id); setRepForm(EMPTY_REPORTE) }}>
                            + Reporte
                          </button>
                        )}
                        {canCreate && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o._id)}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reporte && (
        <div className="modal-overlay" onClick={() => setReporte(null)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">⚙️ Registrar reporte de turno</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setReporte(null)}>✕ Cerrar</button>
            </div>
            <form onSubmit={handleReporte}>
              <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
                <div>
                  <label>Operario *</label>
                  <select value={repForm.operario}
                    onChange={e => setRepForm(f => ({ ...f, operario: e.target.value }))} required>
                    <option value="">Seleccionar operario</option>
                    {operarios.map(op => <option key={op._id} value={op._id}>{op.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label>N° de rollo montado</label>
                  <input value={repForm.numeroRollo}
                    onChange={e => setRepForm(f => ({ ...f, numeroRollo: e.target.value }))}
                    placeholder="Ej: ROLLO-2024-001" />
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
                <div>
                  <label>Hora de inicio</label>
                  <input type="datetime-local" value={repForm.horaInicio}
                    onChange={e => setRepForm(f => ({ ...f, horaInicio: e.target.value }))} />
                </div>
                <div>
                  <label>Hora de finalización</label>
                  <input type="datetime-local" value={repForm.horaFin}
                    onChange={e => setRepForm(f => ({ ...f, horaFin: e.target.value }))} />
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
                <div>
                  <label>Cantidad producida (unidades)</label>
                  <input type="text" inputMode="numeric" value={repForm.cantidadProducida}
                    onChange={e => setRepForm(f => ({ ...f, cantidadProducida: parseNumeric(e.target.value) }))} placeholder="Cantidad" />
                </div>
                <div>
                  <label>Desperdicio (kg)</label>
                  <input type="text" inputMode="decimal" value={repForm.desperdicio}
                    onChange={e => setRepForm(f => ({ ...f, desperdicio: parseNumeric(e.target.value) }))} placeholder="kg" />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label>Observaciones</label>
                <textarea value={repForm.observaciones} rows={2}
                  onChange={e => setRepForm(f => ({ ...f, observaciones: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8,
                  textTransform: 'none', fontSize: '.9rem', color: 'var(--warning)', letterSpacing: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={repForm.finalizar} style={{ width: 'auto' }}
                    onChange={e => setRepForm(f => ({ ...f, finalizar: e.target.checked }))} />
                  Marcar orden como FINALIZADA al guardar
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" type="submit">✓ Guardar reporte</button>
                <button className="btn btn-ghost" type="button" onClick={() => setReporte(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
