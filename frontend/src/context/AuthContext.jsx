import { createContext, useContext, useState } from 'react'
import { FiBarChart2, FiPackage, FiClipboard, FiSettings, FiUsers } from 'react-icons/fi'

// ── Permisos por rol ─────────────────────────────────────────────────────────
// Basado exactamente en los requerimientos de Plastipack:
// - Vendedor: crea pedidos, selecciona referencias. NO crea referencias.
// - Jefe de producción: crea/gestiona referencias, genera órdenes, reportes. NO monta pedidos.
// - Operario: registra reporte de turno en su orden asignada. Solo eso.

export const PERMISOS = {
  vendedor: {
    verDashboard:     true,
    verReferencias:   true,   // puede ver para seleccionarlas al crear pedidos
    editarReferencias: false, // NO puede crear/editar referencias
    verPedidos:       true,
    crearPedidos:     true,
    verOrdenes:       false,  // no necesita ver órdenes de producción
    crearOrdenes:     false,
    registrarReporte: false,
    verUsuarios:      false,
  },
  jefe_produccion: {
    verDashboard:     true,
    verReferencias:   true,
    editarReferencias: true,  // crea y gestiona referencias
    verPedidos:       true,   // puede ver pedidos para gestionar producción
    crearPedidos:     false,  // NO monta pedidos de venta
    verOrdenes:       true,
    crearOrdenes:     true,   // genera órdenes de producción
    registrarReporte: true,   // también puede registrar reportes
    verUsuarios:      true,
    cambiarEstadoLinea: true, // puede cambiar estado de líneas de pedido
  },
  operario: {
    verDashboard:     false,
    verReferencias:   false,
    editarReferencias: false,
    verPedidos:       false,
    crearPedidos:     false,
    verOrdenes:       true,   // ve sus órdenes asignadas
    crearOrdenes:     false,
    registrarReporte: true,   // su única acción: registrar reporte de turno
    verUsuarios:      false,
  },
}

// ── Navegación permitida por rol ─────────────────────────────────────────────
export const NAV_POR_ROL = {
  vendedor: [
    { to: '/referencias', icon: FiPackage, label: 'Referencias' },
    { to: '/pedidos',     icon: FiClipboard, label: 'Pedidos' },
  ],
  jefe_produccion: [
    { to: '/',            icon: FiBarChart2, label: 'Dashboard' },
    { to: '/referencias', icon: FiPackage,    label: 'Referencias' },
    { to: '/pedidos',     icon: FiClipboard,  label: 'Pedidos' },
    { to: '/ordenes',     icon: FiSettings,   label: 'Producción' },
    { to: '/usuarios',    icon: FiUsers,      label: 'Usuarios' },
  ],
  operario: [
    { to: '/ordenes', icon: FiSettings, label: 'Mis órdenes' },
  ],
}

// ── Contexto ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null) // { _id, nombre, email, rol }

  const login  = (u) => setUsuario(u)
  const logout = () => setUsuario(null)

  const puede = (permiso) => {
    if (!usuario) return false
    return PERMISOS[usuario.rol]?.[permiso] ?? false
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, puede }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}