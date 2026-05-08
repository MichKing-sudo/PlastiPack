const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Usuario        = require('./models/Usuario');
const Referencia     = require('./models/Referencia');
const Pedido         = require('./models/Pedido');
const OrdenProduccion = require('./models/OrdenProduccion');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARES ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const getProcessSequence = (procesos = {}) => {
  const sequence = []
  if (procesos.extrusion) sequence.push('extrusion')
  if (procesos.impresionRefilado) sequence.push('impresionRefilado')
  if (procesos.sellado) sequence.push('sellado')
  return sequence
}

const getOrderProcess = (procesos = {}) => {
  if (procesos.extrusion) return 'extrusion'
  if (procesos.impresionRefilado) return 'impresionRefilado'
  if (procesos.sellado) return 'sellado'
  return null
}

const getCompletedQuantity = async (pedidoId, lineaPedidoId, proceso) => {
  const ordenes = await OrdenProduccion.find({
    pedido: pedidoId,
    lineaPedidoId,
    estado: 'finalizado',
    [`procesos.${proceso}`]: true,
  })
  return ordenes.reduce((sum, orden) => sum + (orden.cantidadAsignada || 0), 0)
}

// ── CONEXIÓN A MONGODB ATLAS ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });

// ═══════════════════════════════════════════════════════════════════
// USUARIOS
// Gestión de los tres roles: vendedor | jefe_produccion | operario
// ═══════════════════════════════════════════════════════════════════

// Listar todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { rol } = req.query;
    const filtro = rol ? { rol } : {};
    const usuarios = await Usuario.find(filtro).select('-password').sort({ nombre: 1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const usuario = new Usuario(req.body);
    const saved   = await usuario.save();
    const { password, ...sinPassword } = saved.toObject();
    res.status(201).json(sinPassword);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// REFERENCIAS
// Solo el jefe de producción crea/edita referencias.
// El vendedor NO crea referencias, solo las selecciona al armar pedidos.
// ═══════════════════════════════════════════════════════════════════

// Listar referencias (con filtros opcionales)
app.get('/api/referencias', async (req, res) => {
  try {
    const { tipo, destino, conImpresion, activa } = req.query;
    const filtro = {};
    if (tipo)         filtro.tipo         = tipo;
    if (destino)      filtro.destino      = destino;
    if (conImpresion !== undefined) filtro.conImpresion = conImpresion === 'true';
    if (activa !== undefined) filtro.activa = activa === 'true';
    else filtro.activa = true;

    const referencias = await Referencia.find(filtro)
      .populate('creadoPor', 'nombre rol')
      .sort({ codigo: 1 });
    res.json(referencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una referencia por ID
app.get('/api/referencias/:id', async (req, res) => {
  try {
    const ref = await Referencia.findById(req.params.id)
      .populate('creadoPor', 'nombre rol');
    if (!ref) return res.status(404).json({ error: 'Referencia no encontrada' });
    res.json(ref);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// Crear referencia (solo jefe de producción)
app.post('/api/referencias', async (req, res) => {
  try {
    const ref   = new Referencia(req.body);
    const saved = await ref.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar referencia
app.put('/api/referencias/:id', async (req, res) => {
  try {
    const ref = await Referencia.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ref) return res.status(404).json({ error: 'Referencia no encontrada' });
    res.json(ref);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar (desactivar) referencia — soft delete
app.delete('/api/referencias/:id', async (req, res) => {
  try {
    const ref = await Referencia.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );
    if (!ref) return res.status(404).json({ error: 'Referencia no encontrada' });
    res.json({ message: 'Referencia desactivada correctamente', ref });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PEDIDOS
// El vendedor crea pedidos. Al crearse pasan automáticamente a producción.
// El jefe de producción NO monta pedidos.
// ═══════════════════════════════════════════════════════════════════

// Listar pedidos (con filtros opcionales)
app.get('/api/pedidos', async (req, res) => {
  try {
    const { estadoGeneral, destino, vendedor } = req.query;
    const filtro = {};
    if (estadoGeneral) filtro.estadoGeneral = estadoGeneral;
    if (destino)       filtro.destino       = destino;
    if (vendedor)      filtro.vendedor      = vendedor;

    const pedidos = await Pedido.find(filtro)
      .populate('vendedor', 'nombre email')
      .populate('lineas.referencia', 'codigo tipo dimensiones')
      .sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un pedido por ID
app.get('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('vendedor', 'nombre email')
      .populate('lineas.referencia');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// Crear pedido (vendedor)
// Al crearse, el estado de cada línea queda en 'en_produccion' automáticamente
app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    const saved  = await pedido.save();
    await saved.populate('vendedor', 'nombre email');
    await saved.populate('lineas.referencia', 'codigo tipo');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar estado de una línea dentro del pedido
// PATCH /api/pedidos/:id/lineas/:lineaId
app.patch('/api/pedidos/:id/lineas/:lineaId', async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const linea = pedido.lineas.id(req.params.lineaId);
    if (!linea) return res.status(404).json({ error: 'Línea no encontrada' });

    linea.estado = estado;
    pedido.recalcularEstado();
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar datos generales del pedido
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('vendedor', 'nombre email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ÓRDENES DE PRODUCCIÓN
// El jefe de producción las genera y asigna selladoras.
// El operario registra su reporte de turno.
// Una referencia puede repartirse entre varias selladoras (pedidos grandes).
// ═══════════════════════════════════════════════════════════════════

// Listar órdenes (filtros opcionales: selladora, estado, pedido)
app.get('/api/ordenes', async (req, res) => {
  try {
    const { selladora, estado, pedido } = req.query;
    const filtro = {};
    if (selladora) filtro.selladora = Number(selladora);
    if (estado)    filtro.estado    = estado;
    if (pedido)    filtro.pedido    = pedido;

    const ordenes = await OrdenProduccion.find(filtro)
      .populate('pedido', 'numeroPedido cliente destino fechaEntregaPactada')
      .populate('referencia', 'codigo tipo dimensiones procesos')
      .populate('creadoPor', 'nombre')
      .populate('reportes.operario', 'nombre')
      .sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una orden por ID
app.get('/api/ordenes/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findById(req.params.id)
      .populate('pedido')
      .populate('referencia')
      .populate('creadoPor', 'nombre')
      .populate('reportes.operario', 'nombre');
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(orden);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// Crear orden de producción (jefe de producción)
app.post('/api/ordenes', async (req, res) => {
  try {
    const { pedido: pedidoId, lineaPedidoId, cantidadAsignada, procesos = {} } = req.body
    const proceso = getOrderProcess(procesos)
    if (!proceso) {
      return res.status(400).json({ error: 'Debe seleccionar un proceso de producción válido' })
    }

    const pedido = await Pedido.findById(pedidoId).populate('lineas.referencia', 'procesos')
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })

    const linea = pedido.lineas.id(lineaPedidoId)
    if (!linea) return res.status(404).json({ error: 'Línea de pedido no encontrada' })

    const totalCantidad = linea.cantidad || 0
    const sequence = getProcessSequence(linea.referencia.procesos || {})
    const currentIndex = sequence.indexOf(proceso)
    if (currentIndex === -1) {
      return res.status(400).json({ error: 'El proceso seleccionado no es válido para esta referencia' })
    }

    const assignedForProcess = await OrdenProduccion.find({
      pedido: pedidoId,
      lineaPedidoId,
      [`procesos.${proceso}`]: true,
    })
    .select('cantidadAsignada')

    const totalAssigned = assignedForProcess.reduce((sum, orden) => sum + (orden.cantidadAsignada || 0), 0)
    if (totalAssigned + cantidadAsignada > totalCantidad) {
      return res.status(400).json({ error: 'No se puede asignar más cantidad de la que tiene la línea del pedido' })
    }

    if (currentIndex > 0) {
      const prevProcess = sequence[currentIndex - 1]
      const completedQty = await getCompletedQuantity(pedidoId, lineaPedidoId, prevProcess)
      if (completedQty < totalCantidad) {
        return res.status(400).json({ error: `No se puede iniciar ${proceso} antes de completar ${prevProcess}` })
      }
    }

    const orden = new OrdenProduccion({
      ...req.body,
      procesos: {
        extrusion: proceso === 'extrusion',
        impresionRefilado: proceso === 'impresionRefilado',
        sellado: proceso === 'sellado',
      },
    })
    const saved = await orden.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
});

// Actualizar orden (estado, selladora, etc.)
app.put('/api/ordenes/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(orden);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Agregar reporte de turno a una orden (operario)
// POST /api/ordenes/:id/reportes
app.post('/api/ordenes/:id/reportes', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findById(req.params.id)
      .populate('referencia', 'procesos')
      .populate('pedido')
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    orden.reportes.push(req.body);

    if (req.body.finalizar) {
      orden.estado = 'finalizado';
    } else if (orden.estado === 'pendiente') {
      orden.estado = 'en_proceso';
    }

    await orden.save();

    if (req.body.finalizar) {
      const pedido = await Pedido.findById(orden.pedido._id)
      if (pedido) {
        const linea = pedido.lineas.id(orden.lineaPedidoId)
        if (linea) {
          const proceso = getOrderProcess(orden.procesos)
          const sequence = getProcessSequence(orden.procesos)
          const currentIndex = sequence.indexOf(proceso)
          const totalCantidad = linea.cantidad || 0

          if (currentIndex === -1) {
            // proceso no identificado, no actualizamos línea
          } else if (currentIndex < sequence.length - 1) {
            linea.estado = 'en_produccion'
          } else {
            const completedQty = await getCompletedQuantity(pedido._id, linea._id, proceso)
            if (completedQty >= totalCantidad) {
              linea.estado = 'completado'
            } else {
              linea.estado = 'en_produccion'
            }
          }

          pedido.recalcularEstado()
          await pedido.save()
        }
      }
    }

    res.status(201).json(orden);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar orden
app.delete('/api/ordenes/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByIdAndDelete(req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// REPORTES (jefe de producción)
// ═══════════════════════════════════════════════════════════════════

// Reporte de producción por turno — resumen de todas las selladoras en una fecha
// GET /api/reportes/turno?fecha=2026-04-27
app.get('/api/reportes/turno', async (req, res) => {
  try {
    const fecha  = req.query.fecha ? new Date(req.query.fecha) : new Date();
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin    = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const ordenes = await OrdenProduccion.find({
      'reportes.horaInicio': { $gte: inicio, $lte: fin },
    })
      .populate('referencia', 'codigo tipo')
      .populate('reportes.operario', 'nombre');

    const porSelladora = {};
    for (const orden of ordenes) {
      const s = orden.selladora;
      if (!porSelladora[s]) porSelladora[s] = { selladora: s, reportes: [] };
      for (const r of orden.reportes) {
        if (r.horaInicio >= inicio && r.horaInicio <= fin) {
          porSelladora[s].reportes.push({
            referencia:        orden.referencia?.codigo,
            operario:          r.operario?.nombre,
            numeroRollo:       r.numeroRollo,
            horaInicio:        r.horaInicio,
            horaFin:           r.horaFin,
            cantidadProducida: r.cantidadProducida,
            desperdicio:       r.desperdicio,
          });
        }
      }
    }

    res.json(Object.values(porSelladora));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── INICIAR SERVIDOR ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`
  Endpoints disponibles:
  ── Usuarios      GET|POST        /api/usuarios
                   GET|PUT|DELETE  /api/usuarios/:id
  ── Referencias   GET|POST        /api/referencias
                   GET|PUT|DELETE  /api/referencias/:id
  ── Pedidos       GET|POST        /api/pedidos
                   GET|PUT|DELETE  /api/pedidos/:id
                   PATCH           /api/pedidos/:id/lineas/:lineaId
  ── Órdenes       GET|POST        /api/ordenes
                   GET|PUT|DELETE  /api/ordenes/:id
                   POST            /api/ordenes/:id/reportes
  ── Reportes      GET             /api/reportes/turno?fecha=YYYY-MM-DD
  `);
});
