import { useState } from 'react'
import axios from 'axios'
import { FiBriefcase, FiUser, FiSettings, FiChevronRight } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const ROL_INFO = {
  vendedor: {
    icon: FiBriefcase,
    color: 'var(--accent)',
    desc: 'Crea y gestiona pedidos de venta',
  },
  jefe_produccion: {
    icon: FiSettings,
    color: 'var(--warning)',
    desc: 'Gestiona referencias, órdenes y reportes',
  },
  operario: {
    icon: FiUser,
    color: 'var(--success)',
    desc: 'Registra reportes de turno en selladoras',
  },
}

export default function Login() {
  const { login } = useAuth()
  const [usuarios, setUsuarios]   = useState([])
  const [step, setStep]           = useState('rol')
  const [rolSel, setRolSel]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const ROLES = ['jefe_produccion', 'vendedor', 'operario']
  const ROL_LABELS = { vendedor: 'Vendedor', jefe_produccion: 'Jefe de Producción', operario: 'Operario' }

  const seleccionarRol = async (rol) => {
    setError(''); setLoading(true); setRolSel(rol)
    try {
      const { data } = await axios.get(`/api/usuarios?rol=${rol}`)
      if (data.length === 0) {
        setError(`No hay usuarios con rol ${ROL_LABELS[rol]}. Ejecuta el seeder primero.`)
        setLoading(false); return
      }
      setUsuarios(data)
      setStep('usuario')
    } catch {
      setError('No se pudo conectar al servidor. ¿Está corriendo el backend?')
    }
    setLoading(false)
  }

  const seleccionarUsuario = (u) => {
    login({ _id: u._id, nombre: u.nombre, email: u.email, rol: u.rol })
  }

  const getRgb = (rol) => {
    if (rol === 'vendedor') return '0,212,255'
    if (rol === 'jefe_produccion') return '255,193,69'
    return '0,200,150'
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-title">
            PLASTI<span>PACK</span>
          </div>
          <div className="auth-brand-subtitle">Sistema de Gestión de Producción</div>
          <div className="auth-brand-divider" />
        </div>

        {error && (
          <div className="error-msg">
            <span>⚠</span> {error}
          </div>
        )}

        {step === 'rol' && (
          <>
            <div className="auth-step-title">Selecciona tu rol</div>
            <div className="role-grid">
              {ROLES.map(rol => {
                const info = ROL_INFO[rol]
                const Icon = info.icon
                const rgb = getRgb(rol)
                return (
                  <button key={rol} className="role-button" onClick={() => seleccionarRol(rol)} disabled={loading}>
                    <div className="role-icon" style={{ background: `rgba(${rgb},.15)`, color: info.color }}>
                      <Icon />
                    </div>
                    <div>
                      <div className="role-label">{ROL_LABELS[rol]}</div>
                      <div className="role-desc">{info.desc}</div>
                    </div>
                    <div className="role-action"><FiChevronRight /></div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'usuario' && (
          <>
            <div className="auth-step-head">
              <button className="btn btn-ghost btn-sm" onClick={() => { setStep('rol'); setError('') }}>
                ← Volver
              </button>
              <div className="auth-step-role" style={{ color: ROL_INFO[rolSel]?.color }}>
                {rolSel === 'jefe_produccion' ? 'Jefe de Producción'
                  : rolSel === 'vendedor' ? 'Vendedor' : 'Operario'}
              </div>
            </div>
            <div className="auth-step-title">Selecciona tu usuario</div>
            <div className="role-grid">
              {usuarios.map(u => (
                <button key={u._id} className="user-button" onClick={() => seleccionarUsuario(u)}>
                  <div className="user-icon" style={{ background: `rgba(${getRgb(rolSel)},.18)`, color: ROL_INFO[rolSel]?.color }}>
                    {u.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="user-name">{u.nombre}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <div className="role-action"><FiChevronRight /></div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="auth-footer">© 2026 Plastipack S.A. · Gestión Industrial</div>
      </div>
    </div>
  )
}
