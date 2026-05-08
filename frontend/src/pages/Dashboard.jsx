import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { FiPackage, FiTruck, FiClock, FiCheckCircle, FiBarChart2, FiFileText, FiClipboard, FiTrendingUp } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler)

function StatCard({ icon, label, value, sub, color = 'var(--accent)', trend }) {
  const cardStyle = { background: color, boxShadow: `0 8px 30px ${color}33` }
  return (
    <div className="stat-card card">
      <div className="stat-badge" style={cardStyle}>
        {icon}
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
        {trend !== undefined && (
          <div style={{ fontSize: '.75rem', color: trend >= 0 ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
          </div>
        )}
      </div>
    </div>
  )
}

function getBadge(estado) {
  const map = {
    'en_espera': 'badge-espera', 'en_produccion': 'badge-produccion',
    'completado': 'badge-completado', 'entregado': 'badge-entregado',
  }
  const labels = {
    'en_espera': 'En espera', 'en_produccion': 'En producción',
    'completado': 'Completado', 'entregado': 'Entregado',
  }
  const cls = map[estado] || ''
  const lbl = labels[estado] || estado
  return <span className={`badge ${cls}`}>{lbl}</span>
}

function getBadgeOrden(estado) {
  const map = {
    'pendiente': 'badge-pendiente', 'en_proceso': 'badge-proceso', 'finalizado': 'badge-finalizado',
  }
  const labels = {
    'pendiente': 'Pendiente', 'en_proceso': 'En proceso', 'finalizado': 'Finalizado',
  }
  const cls = map[estado] || ''
  const lbl = labels[estado] || estado
  return <span className={`badge ${cls}`}>{lbl}</span>
}

export default function Dashboard() {
  const { usuario, puede } = useAuth()
  const [pedidos, setPedidos]       = useState([])
  const [refs, setRefs]             = useState([])
  const [ordenes, setOrdenes]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [p, r, o] = await Promise.all([
        axios.get('/api/pedidos'),
        axios.get('/api/referencias'),
        axios.get('/api/ordenes'),
      ])
      setPedidos(p.data)
      setRefs(r.data)
      setOrdenes(o.data)
    } catch (err) {
      console.error('Error cargando dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async () => {
    setReportError('')
    setReportLoading(true)
    try {
      const { data } = await axios.get('/api/reportes/turno', { params: { fecha: reportDate } })
      setReportData(data)
    } catch (err) {
      setReportError('No se pudo generar el reporte.')
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const pedidosPorDia = useMemo(() => {
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const fechaStr = fecha.toISOString().split('T')[0]
      const count = pedidos.filter(p => {
        const pFecha = new Date(p.createdAt).toISOString().split('T')[0]
        return pFecha === fechaStr
      }).length
      dias.push({ fecha: fechaStr, count })
    }
    return dias
  }, [pedidos])

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <div className="loading-text">Cargando dashboard...</div>
    </div>
  )

  const enProduccion = pedidos.filter(p => p.estadoGeneral === 'en_produccion').length
  const enEspera     = pedidos.filter(p => p.estadoGeneral === 'en_espera').length
  const completados  = pedidos.filter(p => p.estadoGeneral === 'completado').length
  const entregados   = pedidos.filter(p => p.estadoGeneral === 'entregado').length

  const ordenesPorEstado = {
    pendiente: ordenes.filter(o => o.estado === 'pendiente').length,
    en_proceso: ordenes.filter(o => o.estado === 'en_proceso').length,
    finalizado: ordenes.filter(o => o.estado === 'finalizado').length,
  }

  const selladoraData = [1,2,3,4,5].map((n) => {
    const ordenesSelladora = ordenes.filter(o => o.selladora === n && o.estado !== 'finalizado')
    const totalAsignado = ordenesSelladora.reduce((sum, ord) => sum + (ord.cantidadAsignada || 0), 0)
    return {
      selladora: n,
      ordenes: ordenesSelladora,
      totalAsignado,
      count: ordenesSelladora.length,
      productoTotal: ordenes.filter(o => o.selladora === n).reduce((sum, ord) => sum + (ord.cantidadAsignada || 0), 0),
    }
  })

  const pedidosRecientes = [...pedidos]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.7)', stepSize: 1, font: { size: 11 } },
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.8)',
          padding: 15,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: '65%',
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.7)', stepSize: 1, font: { size: 11 } },
        beginAtZero: true,
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, backgroundColor: 'var(--accent)' },
    },
  }

  const estadoItems = [
    { label: 'En producción', value: enProduccion, color: 'rgba(255,107,53,0.8)' },
    { label: 'En espera', value: enEspera, color: 'rgba(255,193,69,0.8)' },
    { label: 'Completados', value: completados, color: 'rgba(0,200,150,0.8)' },
    { label: 'Entregados', value: entregados, color: 'rgba(100,150,255,0.8)' },
  ]

  const ordenesEstadoItems = [
    { label: 'Pendientes', value: ordenesPorEstado.pendiente, color: 'rgba(255,193,69,0.8)' },
    { label: 'En proceso', value: ordenesPorEstado.en_proceso, color: 'rgba(255,107,53,0.8)' },
    { label: 'Finalizadas', value: ordenesPorEstado.finalizado, color: 'rgba(0,200,150,0.8)' },
  ]

  if (usuario?.rol === 'operario') {
    const misOrdenes = ordenes.filter(o =>
      o.reportes?.some(r => r.operario === usuario._id) ||
      o.creadoPor === usuario._id
    )
    return (
      <div>
        <div className="section-title">
          <span className="title-icon"><FiClipboard /></span>
          Mis órdenes <span>— {usuario.nombre}</span>
        </div>

        <div className="dashboard-grid">
          <StatCard icon={<FiClipboard />} label="Órdenes asignadas" value={misOrdenes.length} sub="Total asignadas" color="var(--accent)" />
          <StatCard icon={<FiClock />} label="Pendientes" value={misOrdenes.filter(o => o.estado === 'pendiente').length} sub="Por iniciar" color="var(--warning)" />
          <StatCard icon={<FiBarChart2 />} label="En proceso" value={misOrdenes.filter(o => o.estado === 'en_proceso').length} sub="En ejecución" color="var(--accent2)" />
          <StatCard icon={<FiCheckCircle />} label="Finalizadas" value={misOrdenes.filter(o => o.estado === 'finalizado').length} sub="Completadas" color="var(--success)" />
        </div>

        <div className="card">
          <div className="panel-header">
            <div>
              <div className="panel-title">Mis órdenes de producción</div>
              <div className="panel-subtitle">Órdenes asignadas para reporte de turno</div>
            </div>
          </div>
          {misOrdenes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚙️</div>
              No tienes órdenes asignadas.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th><th>Referencia</th><th>Selladora</th>
                    <th>Cantidad</th><th>Estado</th><th>Reportes</th>
                  </tr>
                </thead>
                <tbody>
                  {misOrdenes.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--accent)' }}>
                        {o.pedido?.numeroPedido || '—'}
                      </td>
                      <td>{o.referencia?.codigo || '—'}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>S{o.selladora}</span></td>
                      <td>{(o.cantidadAsignada || 0).toLocaleString()}</td>
                      <td>{getBadgeOrden(o.estado)}</td>
                      <td>{o.reportes?.length || 0} reporte(s)</td>
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

  if (usuario?.rol === 'vendedor') {
    const misPedidos = pedidos.filter(p => p.vendedor?._id === usuario._id)
    return (
      <div>
        <div className="section-title">
          <span className="title-icon"><FiBarChart2 /></span>
          Dashboard <span>— {usuario.nombre}</span>
        </div>

        <div className="dashboard-grid">
          <StatCard icon={<FiPackage />} label="Referencias activas" value={refs.length.toLocaleString()} sub="Catálogo disponible" color="var(--accent)" />
          <StatCard icon={<FiTruck />} label="Mis pedidos activos" value={misPedidos.filter(p => p.estadoGeneral !== 'entregado').length} sub="En proceso" color="var(--accent2)" />
          <StatCard icon={<FiClock />} label="En espera" value={misPedidos.filter(p => p.estadoGeneral === 'en_espera').length} sub="Sin material" color="var(--warning)" />
          <StatCard icon={<FiCheckCircle />} label="Completados" value={misPedidos.filter(p => p.estadoGeneral === 'completado' || p.estadoGeneral === 'entregado').length} sub="Terminados" color="var(--success)" />
        </div>

        <div className="card">
          <div className="panel-header">
            <div>
              <div className="panel-title">Mis pedidos recientes</div>
              <div className="panel-subtitle">Últimos pedidos creados</div>
            </div>
          </div>
          {misPedidos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              No has creado pedidos aún.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>N° Pedido</th><th>Cliente</th><th>Entrega</th>
                    <th>Estado</th><th>Líneas</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosRecientes.filter(p => p.vendedor?._id === usuario._id).map(p => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--accent)' }}>{p.numeroPedido}</td>
                      <td style={{ color: 'var(--text2)' }}>{p.cliente || 'Interno'}</td>
                      <td style={{ fontSize: '.85rem', color: 'var(--text3)' }}>{new Date(p.fechaEntregaPactada).toLocaleDateString('es-CO')}</td>
                      <td>{getBadge(p.estadoGeneral)}</td>
                      <td style={{ fontSize: '.85rem', color: 'var(--text3)' }}>{p.lineas?.length} ref.</td>
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

  // Jefe de producción: vista completa
  return (
    <div>
      <div className="section-title">
        <span className="title-icon"><FiBarChart2 /></span>
        Dashboard <span>— Plastipack</span>
      </div>

      <div className="dashboard-grid">
        <StatCard icon={<FiPackage />} label="Referencias activas" value={refs.length.toLocaleString()} sub="Total referencias" color="var(--accent)" />
        <StatCard icon={<FiTruck />} label="En producción" value={enProduccion} sub="Pedidos activos" color="var(--accent2)" />
        <StatCard icon={<FiClock />} label="En espera" value={enEspera} sub="Sin material" color="var(--warning)" />
        <StatCard icon={<FiCheckCircle />} label="Completados" value={completados} sub="Terminados" color="var(--success)" />
      </div>

      <div className="dashboard-two-column" style={{ marginBottom: 24 }}>
        <div className="card" style={{ height: 320 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Estados de pedidos</div>
              <div className="panel-subtitle">Distribución actual del estado general</div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <Doughnut
              data={{
                labels: estadoItems.filter(i => i.value > 0).map(i => i.label),
                datasets: [{
                  data: estadoItems.filter(i => i.value > 0).map(i => i.value),
                  backgroundColor: estadoItems.filter(i => i.value > 0).map(i => i.color),
                  borderWidth: 0,
                  hoverOffset: 8,
                }],
              }}
              options={doughnutOptions}
            />
          </div>
        </div>

        <div className="card" style={{ height: 320 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Pedidos por día</div>
              <div className="panel-subtitle">Últimos 7 días</div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <Line
              data={{
                labels: pedidosPorDia.map(d => new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short' })),
                datasets: [{
                  data: pedidosPorDia.map(d => d.count),
                  borderColor: 'var(--accent)',
                  backgroundColor: 'rgba(0,212,255,0.1)',
                  fill: true,
                  tension: 0.4,
                }],
              }}
              options={lineOptions}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-two-column" style={{ marginBottom: 24 }}>
        <div className="card" style={{ height: 320 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Órdenes por estado</div>
              <div className="panel-subtitle">Producción actual</div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels: ordenesEstadoItems.map(i => i.label),
                datasets: [{
                  data: ordenesEstadoItems.map(i => i.value),
                  backgroundColor: ordenesEstadoItems.map(i => i.color),
                  borderRadius: 8,
                  barThickness: 40,
                }],
              }}
              options={barOptions}
            />
          </div>
        </div>

        <div className="card" style={{ height: 320 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Carga por selladora</div>
              <div className="panel-subtitle">Órdenes activas por máquina</div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels: selladoraData.map(s => `S${s.selladora}`),
                datasets: [{
                  label: 'Órdenes activas',
                  data: selladoraData.map(s => s.count),
                  backgroundColor: 'rgba(255,107,53,0.7)',
                  borderRadius: 8,
                  barThickness: 30,
                }, {
                  label: 'Cantidad asignada (miles)',
                  data: selladoraData.map(s => Math.min(s.totalAsignado / 1000, 50)),
                  backgroundColor: 'rgba(0,212,255,0.5)',
                  borderRadius: 8,
                  barThickness: 30,
                }],
              }}
              options={{
                ...barOptions,
                plugins: {
                  ...barOptions.plugins,
                  legend: { display: true, position: 'top', labels: { color: 'rgba(255,255,255,0.8)', font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Estado de selladoras</div>
            <div className="panel-subtitle">Órdenes activas por selladora</div>
          </div>
        </div>
        <div className="selladora-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {selladoraData.map((slot) => (
            <div className="card" key={slot.selladora} style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                Selladora {slot.selladora}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                {slot.count}
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: 8 }}>
                orden(es) activa(s)
              </div>
              <div style={{ fontSize: '.85rem', color: 'var(--accent2)', fontWeight: 600 }}>
                {slot.totalAsignado.toLocaleString()} uds
              </div>
              <div style={{ marginTop: 12, height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((slot.count / Math.max(...selladoraData.map(s => s.count), 1)) * 100, 100)}%`,
                  background: slot.count > 0 ? 'var(--accent)' : 'var(--text3)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Pedidos recientes</div>
            <div className="panel-subtitle">Últimos 5 pedidos registrados</div>
          </div>
          <div className="panel-icon"><FiTrendingUp /></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>N°</th><th>Cliente</th><th>Entrega</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidosRecientes.map(p => (
                <tr key={p._id}>
                  <td className="text-accent">{p.numeroPedido}</td>
                  <td className="text-muted">{p.cliente || 'Interno'}</td>
                  <td className="text-small">{new Date(p.fechaEntregaPactada).toLocaleDateString('es-CO')}</td>
                  <td>{getBadge(p.estadoGeneral)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {usuario?.rol === 'jefe_produccion' && (
        <div className="card report-section">
          <div className="panel-header">
            <div>
              <div className="panel-title">Reporte de turno</div>
              <div className="panel-subtitle">Genera un informe por fecha</div>
            </div>
            <div className="panel-icon"><FiFileText /></div>
          </div>
          <div className="report-controls">
            <label>
              Fecha de reporte
              <input type="date" value={reportDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setReportDate(e.target.value)} />
            </label>
            <button className="btn btn-primary" onClick={loadReport} disabled={reportLoading}>
              {reportLoading ? 'Generando...' : 'Generar reporte'}
            </button>
          </div>
          {reportError && <div className="error-msg"><span>⚠</span> {reportError}</div>}
          {reportData.length > 0 ? (
            <div className="report-list">
              {reportData.map((item, idx) => (
                <div key={`${item.referencia}-${idx}`} className="report-card">
                  <div className="report-card-title">{item.referencia || 'Sin referencia'}</div>
                  <div className="report-card-row"><span>Operario</span><strong>{item.operario || 'Desconocido'}</strong></div>
                  <div className="report-card-row"><span>Cantidad producida</span><strong>{item.cantidadProducida || 0}</strong></div>
                  <div className="report-card-row"><span>Desperdicio</span><strong>{item.desperdicio || 0}</strong></div>
                </div>
              ))}
            </div>
          ) : reportLoading ? (
            <div className="loading-container" style={{ padding: '30px 20px' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
              <div className="loading-text">Generando reporte...</div>
            </div>
          ) : (
            <div className="empty-state">Haz clic en "Generar reporte" para ver resultados.</div>
          )}
        </div>
      )}
    </div>
  )
}
