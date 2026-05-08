import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function getBadge(estado) {
  const map = {
    en_espera: ['badge-espera', 'En espera'],
    en_produccion: ['badge-produccion', 'En producción'],
    completado: ['badge-completado', 'Completado'],
    entregado: ['badge-entregado', 'Entregado'],
  }
  const [cls, label] = map[estado] || ['', estado]
  return <span className={`badge ${cls}`}>{label}</span>
}

function minFecha() {
  const d = new Date()
  d.setDate(d.getDate() + 15)
  return d.toISOString().split('T')[0]
}

export default function Pedidos() {
  const [pedidos, setPedidos]         = useState([])
  const [referencias, setReferencias] = useState([])
  const [usuarios, setUsuarios]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [detalle, setDetalle]         = useState(null)
  const [filtro, setFiltro]           = useState('')

  const [form, setForm] = useState({
    vendedor: '', tipoVenta: 'almacen', destino: 'externo',
    cliente: '', fechaEntregaPactada: minFecha(), observaciones: '',
  })
  const [lineas, setLineas] = useState([
    { referencia: '', cantidad: 1, valorUnitario: 0 }
  ])

  const { puede } = useAuth()
  const canCreate = puede('crearPedidos')
  const canManage = puede('cambiarEstadoLinea')

  const load = async () => {
    setLoading(true)
    try {
      const params = filtro ? { estadoGeneral: filtro } : {}
      const [p, r, u] = await Promise.all([
        axios.get('/api/pedidos', { params }),
        axios.get('/api/referencias'),
        axios.get('/api/usuarios?rol=vendedor'),
      ])
      setPedidos(p.data); setReferencias(r.data); setUsuarios(u.data)
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtro])

  const addLinea = () =>
    setLineas(l => [...l, { referencia: '', cantidad: 1, valorUnitario: 0 }])

  const removeLinea = (i) =>
    setLineas(l => l.filter((_, idx) => idx !== i))

  const parseNumeric = (value) => value === '' ? '' : Number(value)

  const updateLinea = (i, field, value) =>
    setLineas(l => l.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (lineas.some(l => !l.referencia)) {
      return setError('Todas las líneas deben tener una referencia seleccionada')
    }
    try {
      await axios.post('/api/pedidos', { ...form, lineas })
      setSuccess('Pedido creado y enviado a producción correctamente')
      setShowForm(false)
      setForm({ vendedor: '', tipoVenta: 'almacen', destino: 'externo',
        cliente: '', fechaEntregaPactada: minFecha(), observaciones: '' })
      setLineas([{ referencia: '', cantidad: 1, valorUnitario: 0 }])
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear pedido')
    }
  }

  const actualizarLineaEstado = async (pedidoId, lineaId, estado) => {
    try {
      await axios.patch(`/api/pedidos/${pedidoId}/lineas/${lineaId}`, { estado })
      setSuccess('Estado actualizado')
      const { data } = await axios.get(`/api/pedidos/${pedidoId}`)
      setDetalle(data)
      load()
    } catch {
      setError('Error al actualizar estado')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este pedido?')) return
    try {
      await axios.delete(`/api/pedidos/${id}`)
      setSuccess('Pedido eliminado'); load()
    } catch {
      setError('Error al eliminar')
    }
  }

  const ESTADOS_LINEA = ['en_espera', 'en_produccion', 'completado', 'entregado']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Pedidos <span>de venta</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ width: 180 }}>
            <option value="">Todos los estados</option>
            <option value="en_espera">En espera</option>
            <option value="en_produccion">En producción</option>
            <option value="completado">Completado</option>
            <option value="entregado">Entregado</option>
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cerrar' : '+ Nuevo pedido'}
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
            + Nuevo pedido
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-3" style={{ marginBottom: 18 }}>
              <div>
                <label>Vendedor *</label>
                <select value={form.vendedor} onChange={e => setForm(f => ({ ...f, vendedor: e.target.value }))} required>
                  <option value="">Seleccionar vendedor</option>
                  {usuarios.map(u => <option key={u._id} value={u._id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label>Tipo de venta *</label>
                <select value={form.tipoVenta} onChange={e => setForm(f => ({ ...f, tipoVenta: e.target.value }))}>
                  <option value="almacen">Venta en almacén</option>
                  <option value="personalizado">Pedido personalizado</option>
                </select>
              </div>
              <div>
                <label>Destino *</label>
                <select value={form.destino} onChange={e => setForm(f => ({ ...f, destino: e.target.value }))}>
                  <option value="externo">Cliente externo</option>
                  <option value="interno">Consumo interno</option>
                </select>
              </div>
            </div>

            <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label>Cliente</label>
                <input value={form.cliente}
                  onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
                  placeholder="Nombre del cliente (si es externo)" />
              </div>
              <div>
                <label>Fecha entrega pactada * (mín. 15 días)</label>
                <input type="date" value={form.fechaEntregaPactada} min={minFecha()}
                  onChange={e => setForm(f => ({ ...f, fechaEntregaPactada: e.target.value }))} required />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ margin: 0 }}>Referencias del pedido *</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addLinea}>+ Agregar línea</button>
              </div>
              <div className="table-wrapper" style={{ marginBottom: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Referencia</th><th>Cantidad</th><th>Valor unitario</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, i) => (
                      <tr key={i}>
                        <td>
                          <select value={l.referencia}
                            onChange={e => updateLinea(i, 'referencia', e.target.value)} required>
                            <option value="">Seleccionar referencia</option>
                            {referencias.map(r => (
                              <option key={r._id} value={r._id}>
                                {r.codigo} — {r.tipo} {r.dimensiones.ancho}×{r.dimensiones.largo}{r.dimensiones.unidad}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input type="text" inputMode="numeric" value={l.cantidad}
                            onChange={e => updateLinea(i, 'cantidad', parseNumeric(e.target.value))}
                            placeholder="Cantidad" />
                        </td>
                        <td>
                          <input type="text" inputMode="decimal" value={l.valorUnitario}
                            onChange={e => updateLinea(i, 'valorUnitario', parseNumeric(e.target.value))}
                            placeholder="Valor unitario" />
                        </td>
                        <td>
                          {lineas.length > 1 && (
                            <button type="button" className="btn btn-danger btn-sm"
                              onClick={() => removeLinea(i)}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label>Observaciones</label>
              <textarea value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                rows={2} placeholder="Opcional" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit">✓ Crear pedido</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
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
        ) : pedidos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            No hay pedidos.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>N° Pedido</th><th>Tipo</th><th>Cliente</th>
                  <th>Destino</th><th>Entrega</th><th>Líneas</th>
                  <th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p._id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700,
                        color: 'var(--accent)', fontSize: '1rem' }}>{p.numeroPedido}</span>
                    </td>
                    <td style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                      {p.tipoVenta === 'almacen' ? 'Almacén' : 'Personalizado'}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{p.cliente || '—'}</td>
                    <td>
                      <span className={`badge ${p.destino === 'externo' ? 'badge-produccion' : 'badge-espera'}`}>
                        {p.destino === 'externo' ? 'Externo' : 'Interno'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.85rem', color: 'var(--text3)' }}>
                      {new Date(p.fechaEntregaPactada).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ fontSize: '.85rem', color: 'var(--text3)' }}>
                      {p.lineas?.length} ref.
                    </td>
                    <td>{getBadge(p.estadoGeneral)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={async () => {
                            const { data } = await axios.get(`/api/pedidos/${p._id}`)
                            setDetalle(data)
                          }}>
                          Ver detalle
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{detalle.numeroPedido}</div>
                <div className="modal-subtitle">
                  {detalle.cliente || 'Consumo interno'} · {detalle.tipoVenta === 'almacen' ? 'Almacén' : 'Personalizado'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetalle(null)}>✕ Cerrar</button>
            </div>

            <div style={{ marginBottom: 6, fontSize: '.85rem', color: 'var(--text2)' }}>
              Entrega pactada: <strong style={{ color: 'var(--text)' }}>
                {new Date(detalle.fechaEntregaPactada).toLocaleDateString('es-CO')}
              </strong>
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 20 }}>
              Estado general: {getBadge(detalle.estadoGeneral)}
            </div>

            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, textTransform: 'uppercase',
              fontSize: '.88rem', color: 'var(--text2)', marginBottom: 12, letterSpacing: '.06em' }}>
              Referencias del pedido
            </div>
            <div className="table-wrapper" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Referencia</th><th>Cantidad</th><th>Valor unit.</th><th>Estado</th>
                    {canManage && <th>Cambiar estado</th>}
                  </tr>
                </thead>
                <tbody>
                  {detalle.lineas?.map(l => (
                    <tr key={l._id}>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--accent)' }}>
                        {l.referencia?.codigo || '—'}
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                          {l.referencia?.tipo} {l.referencia?.dimensiones?.ancho}×{l.referencia?.dimensiones?.largo}
                        </div>
                      </td>
                      <td>{l.cantidad}</td>
                      <td>${Number(l.valorUnitario).toLocaleString('es-CO')}</td>
                      <td>{getBadge(l.estado)}</td>
                      {canManage && (
                        <td>
                          <select value={l.estado} style={{ width: 150 }}
                            onChange={e => actualizarLineaEstado(detalle._id, l._id, e.target.value)}>
                            {ESTADOS_LINEA.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detalle.observaciones && (
              <div style={{ marginTop: 16, fontSize: '.88rem', color: 'var(--text2)' }}>
                <strong>Observaciones:</strong> {detalle.observaciones}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
