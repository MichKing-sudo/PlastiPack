import { useEffect, useState } from 'react'
import axios from 'axios'

const EMPTY = { nombre: '', email: '', password: '', rol: 'vendedor', activo: true }

const ROL_LABELS = {
  vendedor: 'Vendedor',
  jefe_produccion: 'Jefe de Producción',
  operario: 'Operario',
}

const ROL_COLORS = {
  vendedor: 'badge-produccion',
  jefe_produccion: 'badge-espera',
  operario: 'badge-completado',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm]         = useState(EMPTY)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filtroRol, setFiltroRol] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = filtroRol ? { rol: filtroRol } : {}
      const { data } = await axios.get('/api/usuarios', { params })
      setUsuarios(data)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtroRol])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await axios.put(`/api/usuarios/${editing}`, payload)
        setSuccess('Usuario actualizado correctamente')
      } else {
        await axios.post('/api/usuarios', form)
        setSuccess('Usuario creado correctamente')
      }
      setForm(EMPTY); setEditing(null); setShowForm(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleEdit = u => {
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: u.activo })
    setEditing(u._id); setShowForm(true); setError(''); setSuccess('')
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await axios.delete(`/api/usuarios/${id}`)
      setSuccess('Usuario eliminado'); load()
    } catch {
      setError('Error al eliminar')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Usuarios <span>del sistema</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} style={{ width: 200 }}>
            <option value="">Todos los roles</option>
            <option value="vendedor">Vendedor</option>
            <option value="jefe_produccion">Jefe de Producción</option>
            <option value="operario">Operario</option>
          </select>
          <button className="btn btn-primary" onClick={() => {
            setForm(EMPTY); setEditing(null); setShowForm(!showForm)
          }}>
            {showForm ? '✕ Cerrar' : '+ Nuevo usuario'}
          </button>
        </div>
      </div>

      {error   && <div className="error-msg"><span>⚠</span> {error}</div>}
      {success && <div className="success-msg"><span>✓</span> {success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.15rem',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>
            {editing ? '✎ Editar usuario' : '+ Nuevo usuario'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label>Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Carlos Gómez" />
              </div>
              <div>
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@plastipack.com" />
              </div>
            </div>
            <div className="form-grid form-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label>{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!editing} placeholder="••••••••" />
              </div>
              <div>
                <label>Rol *</label>
                <select name="rol" value={form.rol} onChange={handleChange}>
                  <option value="vendedor">Vendedor</option>
                  <option value="jefe_produccion">Jefe de Producción</option>
                  <option value="operario">Operario</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8,
                textTransform: 'none', fontSize: '.9rem', color: 'var(--text)', letterSpacing: 0 }}>
                <input type="checkbox" name="activo" checked={form.activo}
                  onChange={handleChange} style={{ width: 'auto' }} />
                Usuario activo
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit">
                {editing ? '✓ Guardar cambios' : '+ Crear usuario'}
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
        ) : usuarios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${ROL_COLORS[u.rol] || ''}`}>
                        {ROL_LABELS[u.rol] || u.rol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-completado' : 'badge-espera'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)}>✎ Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>✕</button>
                      </div>
                    </td>
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
