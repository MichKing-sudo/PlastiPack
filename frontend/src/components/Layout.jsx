import { NavLink } from 'react-router-dom'
import { useAuth, NAV_POR_ROL } from '../context/AuthContext'

const ROL_LABELS = {
  vendedor:        'Vendedor',
  jefe_produccion: 'Jefe de Producción',
  operario:        'Operario',
}

const ROL_RGB = {
  vendedor:        '0,212,255',
  jefe_produccion: '255,193,69',
  operario:        '0,200,150',
}

const ROL_COLORS = {
  vendedor:        'var(--accent)',
  jefe_produccion: 'var(--warning)',
  operario:        'var(--success)',
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const navItems = NAV_POR_ROL[usuario?.rol] || []
  const color    = ROL_COLORS[usuario?.rol]  || 'var(--accent)'
  const rgb      = ROL_RGB[usuario?.rol]     || '0,212,255'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            PLASTI<span>PACK</span>
          </div>
          <div className="sidebar-tag">Gestión de Producción</div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: `rgba(${rgb},.15)`, color }}>
            {usuario?.nombre?.charAt(0)}
          </div>
          <div>
            <div className="sidebar-username">{usuario?.nombre}</div>
            <div className="sidebar-role">{ROL_LABELS[usuario?.rol]}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label }) => {
            const Icon = icon
            return (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  '--active-color': isActive ? color : 'transparent',
                  '--active-bg': isActive ? `rgba(${rgb},.08)` : 'transparent',
                  color: isActive ? color : 'var(--text2)',
                })}
              >
                <Icon className="nav-icon" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>⇤ Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
