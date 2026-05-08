import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, PERMISOS } from './context/AuthContext'

import Login       from './pages/Login'
import Layout      from './components/Layout'
import Dashboard   from './pages/Dashboard'
import Referencias from './pages/Referencias'
import Pedidos     from './pages/Pedidos'
import Ordenes     from './pages/Ordenes'
import Usuarios    from './pages/Usuarios'

// ── Ruta protegida ────────────────────────────────────────────────────────────
function RutaProtegida({ permiso, children }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/" replace />
  if (permiso && !PERMISOS[usuario.rol]?.[permiso]) {
    const fallback = {
      vendedor:        '/referencias',
      jefe_produccion: '/dashboard',
      operario:        '/ordenes',
    }
    return <Navigate to={fallback[usuario.rol] || '/'} replace />
  }
  return children
}

// ── Router interno ────────────────────────────────────────────────────────────
function AppRouter() {
  const { usuario } = useAuth()

  if (!usuario) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <RutaProtegida permiso="verDashboard">
            <Dashboard />
          </RutaProtegida>
        } />
        <Route path="/referencias" element={
          <RutaProtegida permiso="verReferencias">
            <Referencias />
          </RutaProtegida>
        } />
        <Route path="/pedidos" element={
          <RutaProtegida permiso="verPedidos">
            <Pedidos />
          </RutaProtegida>
        } />
        <Route path="/ordenes" element={
          <RutaProtegida permiso="verOrdenes">
            <Ordenes />
          </RutaProtegida>
        } />
        <Route path="/usuarios" element={
          <RutaProtegida permiso="verUsuarios">
            <Usuarios />
          </RutaProtegida>
        } />
        <Route path="*" element={
          <Navigate to={
            usuario.rol === 'vendedor' ? '/referencias' :
            usuario.rol === 'operario' ? '/ordenes' : '/'
          } replace />
        } />
      </Routes>
    </Layout>
  )
}

// ── App raíz ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  )
}