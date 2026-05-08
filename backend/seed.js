const mongoose = require('mongoose');
require('dotenv').config();

const Usuario         = require('./models/Usuario');
const Referencia      = require('./models/Referencia');
const Pedido          = require('./models/Pedido');
const OrdenProduccion = require('./models/OrdenProduccion');

// ── Helpers ──────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function fechaFutura(diasMin = 16, diasMax = 45) {
  const d = new Date()
  d.setDate(d.getDate() + randNum(diasMin, diasMax))
  return d
}

// Para pedidos ya completados/entregados usamos fechas pasadas
function fechaPasadaDias(diasAtras = 10) {
  const d = new Date()
  d.setDate(d.getDate() - randNum(1, diasAtras))
  return d
}

function fechaPasada(horasAtras = 8) {
  const d = new Date()
  d.setHours(d.getHours() - horasAtras)
  return d
}

// ════════════════════════════════════════════════════════════════════════════
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Conectado a MongoDB Atlas')

  // ── Limpiar colecciones ──────────────────────────────────────────────────
  await Promise.all([
    Usuario.deleteMany({}),
    Referencia.deleteMany({}),
    Pedido.deleteMany({}),
    OrdenProduccion.deleteMany({}),
  ])
  console.log('🗑  Colecciones limpiadas')

  // ════════════════════════════════════════════════════════════════════════
  // USUARIOS
  // ════════════════════════════════════════════════════════════════════════
  const usuarios = await Usuario.insertMany([
    // Jefes de producción
    { nombre: 'María Fernanda Torres', email: 'mftorres@plastipack.com',   password: '1234', rol: 'jefe_produccion' },
    { nombre: 'Jorge Andrés Ríos',     email: 'jarios@plastipack.com',     password: '1234', rol: 'jefe_produccion' },
    // Vendedores
    { nombre: 'Camila Herrera Soto',   email: 'cherrera@plastipack.com',   password: '1234', rol: 'vendedor' },
    { nombre: 'Sebastián Mora Pérez',  email: 'smora@plastipack.com',      password: '1234', rol: 'vendedor' },
    { nombre: 'Valentina Cruz López',  email: 'vcruz@plastipack.com',      password: '1234', rol: 'vendedor' },
    // Operarios
    { nombre: 'Luis Enrique Patiño',   email: 'lpatino@plastipack.com',    password: '1234', rol: 'operario' },
    { nombre: 'Ana Lucía Gómez',       email: 'algomez@plastipack.com',    password: '1234', rol: 'operario' },
    { nombre: 'Carlos Alberto Ruiz',   email: 'caruiz@plastipack.com',     password: '1234', rol: 'operario' },
    { nombre: 'Diana Marcela Villa',   email: 'dmvilla@plastipack.com',    password: '1234', rol: 'operario' },
    { nombre: 'Jhon Fredy Castillo',   email: 'jfcastillo@plastipack.com', password: '1234', rol: 'operario' },
  ])

  const jefes     = usuarios.filter(u => u.rol === 'jefe_produccion')
  const vendedores = usuarios.filter(u => u.rol === 'vendedor')
  const operarios  = usuarios.filter(u => u.rol === 'operario')
  console.log(`👤 ${usuarios.length} usuarios creados`)

  // ════════════════════════════════════════════════════════════════════════
  // REFERENCIAS
  // ════════════════════════════════════════════════════════════════════════
  const refData = [
    // Bolsas
    { codigo: 'BOL-PE-3040-N',  tipo: 'bolsa',  materiaPrima: 'Polietileno LD', dimensiones: { ancho: 30, largo: 40, calibre: 200, unidad: 'cm' }, conImpresion: false, destino: 'externo', procesos: { extrusion: true, impresionRefilado: false, sellado: true } },
    { codigo: 'BOL-PE-4060-L',  tipo: 'bolsa',  materiaPrima: 'Polietileno LD', dimensiones: { ancho: 40, largo: 60, calibre: 250, unidad: 'cm' }, conImpresion: true,  destino: 'externo', procesos: { extrusion: true, impresionRefilado: true,  sellado: true } },
    { codigo: 'BOL-HD-2535-N',  tipo: 'bolsa',  materiaPrima: 'Polietileno HD', dimensiones: { ancho: 25, largo: 35, calibre: 180, unidad: 'cm' }, conImpresion: false, destino: 'externo', procesos: { extrusion: true, impresionRefilado: false, sellado: true } },
    { codigo: 'BOL-HD-5080-L',  tipo: 'bolsa',  materiaPrima: 'Polietileno HD', dimensiones: { ancho: 50, largo: 80, calibre: 300, unidad: 'cm' }, conImpresion: true,  destino: 'externo', procesos: { extrusion: true, impresionRefilado: true,  sellado: true } },
    { codigo: 'BOL-PP-2030-N',  tipo: 'bolsa',  materiaPrima: 'Polipropileno',  dimensiones: { ancho: 20, largo: 30, calibre: 150, unidad: 'cm' }, conImpresion: false, destino: 'interno', procesos: { extrusion: true, impresionRefilado: false, sellado: true } },
    { codigo: 'BOL-PP-3550-L',  tipo: 'bolsa',  materiaPrima: 'Polipropileno',  dimensiones: { ancho: 35, largo: 50, calibre: 200, unidad: 'cm' }, conImpresion: true,  destino: 'externo', procesos: { extrusion: true, impresionRefilado: true,  sellado: true } },
    // Rollos
    { codigo: 'ROL-PE-100-200', tipo: 'rollo',  materiaPrima: 'Polietileno LD', dimensiones: { ancho: 100, largo: 200, calibre: 300, unidad: 'cm' }, conImpresion: false, destino: 'externo', procesos: { extrusion: true, impresionRefilado: false, sellado: false } },
    { codigo: 'ROL-PE-120-300', tipo: 'rollo',  materiaPrima: 'Polietileno LD', dimensiones: { ancho: 120, largo: 300, calibre: 350, unidad: 'cm' }, conImpresion: true,  destino: 'externo', procesos: { extrusion: true, impresionRefilado: true,  sellado: false } },
    { codigo: 'ROL-HD-80-150',  tipo: 'rollo',  materiaPrima: 'Polietileno HD', dimensiones: { ancho: 80,  largo: 150, calibre: 400, unidad: 'cm' }, conImpresion: false, destino: 'interno', procesos: { extrusion: true, impresionRefilado: false, sellado: false } },
    { codigo: 'ROL-INV-200-50', tipo: 'rollo',  materiaPrima: 'Polietileno UV', dimensiones: { ancho: 200, largo: 50,  calibre: 600, unidad: 'cm' }, conImpresion: false, destino: 'externo', procesos: { extrusion: true, impresionRefilado: false, sellado: false }, descripcion: 'Lámina invernadero' },
    // Láminas
    { codigo: 'LAM-PE-6080-N',  tipo: 'lamina', materiaPrima: 'Polietileno LD', dimensiones: { ancho: 60, largo: 80,  calibre: 500, unidad: 'cm' }, conImpresion: false, destino: 'externo', procesos: { extrusion: true, impresionRefilado: false, sellado: true } },
    { codigo: 'LAM-HD-8010-L',  tipo: 'lamina', materiaPrima: 'Polietileno HD', dimensiones: { ancho: 80, largo: 100, calibre: 550, unidad: 'cm' }, conImpresion: true,  destino: 'externo', procesos: { extrusion: true, impresionRefilado: true,  sellado: true } },
    { codigo: 'LAM-PP-4060-N',  tipo: 'lamina', materiaPrima: 'Polipropileno',  dimensiones: { ancho: 40, largo: 60,  calibre: 400, unidad: 'cm' }, conImpresion: false, destino: 'interno', procesos: { extrusion: true, impresionRefilado: false, sellado: true } },
  ]

  const referencias = await Referencia.insertMany(
    refData.map(r => ({ ...r, creadoPor: rand(jefes)._id }))
  )
  console.log(`📦 ${referencias.length} referencias creadas`)

  // ════════════════════════════════════════════════════════════════════════
  // PEDIDOS
  // ════════════════════════════════════════════════════════════════════════
  const clientes = ['Supermercados Éxito S.A.', 'Almacenes La 14', 'Distribuidora Norma', 'Agropecuaria El Campo', 'Industrias Plásticas del Norte', null]

  const pedidosData = [
    // En producción
    {
      vendedor: vendedores[0]._id, tipoVenta: 'personalizado', destino: 'externo',
      cliente: clientes[0], fechaEntregaPactada: fechaFutura(15, 20),
      estadoGeneral: 'en_produccion',
      lineas: [
        { referencia: referencias[0]._id, cantidad: 5000, valorUnitario: 350,  estado: 'en_produccion' },
        { referencia: referencias[1]._id, cantidad: 3000, valorUnitario: 480,  estado: 'en_produccion' },
        { referencia: referencias[6]._id, cantidad: 800,  valorUnitario: 1200, estado: 'en_espera' },
      ],
    },
    {
      vendedor: vendedores[1]._id, tipoVenta: 'almacen', destino: 'externo',
      cliente: clientes[1], fechaEntregaPactada: fechaFutura(16, 25),
      estadoGeneral: 'en_produccion',
      lineas: [
        { referencia: referencias[2]._id, cantidad: 10000, valorUnitario: 280, estado: 'en_produccion' },
        { referencia: referencias[4]._id, cantidad: 6000,  valorUnitario: 310, estado: 'en_produccion' },
      ],
    },
    {
      vendedor: vendedores[2]._id, tipoVenta: 'personalizado', destino: 'externo',
      cliente: clientes[2], fechaEntregaPactada: fechaFutura(18, 30),
      estadoGeneral: 'en_produccion',
      lineas: [
        { referencia: referencias[7]._id, cantidad: 200,  valorUnitario: 8500, estado: 'en_produccion' },
        { referencia: referencias[10]._id, cantidad: 500, valorUnitario: 2200, estado: 'en_espera' },
      ],
    },
    // En espera
    {
      vendedor: vendedores[0]._id, tipoVenta: 'almacen', destino: 'interno',
      cliente: '', fechaEntregaPactada: fechaFutura(20, 35),
      estadoGeneral: 'en_espera',
      lineas: [
        { referencia: referencias[8]._id,  cantidad: 300, valorUnitario: 5000, estado: 'en_espera' },
        { referencia: referencias[12]._id, cantidad: 150, valorUnitario: 3800, estado: 'en_espera' },
      ],
    },
    {
      vendedor: vendedores[1]._id, tipoVenta: 'personalizado', destino: 'externo',
      cliente: clientes[3], fechaEntregaPactada: fechaFutura(25, 40),
      estadoGeneral: 'en_espera',
      lineas: [
        { referencia: referencias[9]._id, cantidad: 50, valorUnitario: 45000, estado: 'en_espera' },
      ],
    },
    // Completados — fechas pasadas (ya se cumplieron)
    {
      vendedor: vendedores[2]._id, tipoVenta: 'almacen', destino: 'externo',
      cliente: clientes[4], fechaEntregaPactada: fechaPasadaDias(5),
      estadoGeneral: 'completado',
      lineas: [
        { referencia: referencias[3]._id, cantidad: 2000, valorUnitario: 650, estado: 'completado' },
        { referencia: referencias[5]._id, cantidad: 1500, valorUnitario: 720, estado: 'completado' },
      ],
    },
    {
      vendedor: vendedores[0]._id, tipoVenta: 'personalizado', destino: 'externo',
      cliente: clientes[0], fechaEntregaPactada: fechaPasadaDias(3),
      estadoGeneral: 'completado',
      lineas: [
        { referencia: referencias[11]._id, cantidad: 300, valorUnitario: 4200, estado: 'completado' },
      ],
    },
    // Entregado — ya entregado al cliente
    {
      vendedor: vendedores[1]._id, tipoVenta: 'almacen', destino: 'externo',
      cliente: clientes[1], fechaEntregaPactada: fechaPasadaDias(8),
      estadoGeneral: 'entregado',
      lineas: [
        { referencia: referencias[0]._id, cantidad: 8000, valorUnitario: 340, estado: 'entregado' },
        { referencia: referencias[2]._id, cantidad: 4000, valorUnitario: 270, estado: 'entregado' },
      ],
    },
  ]

  // validateBeforeSave:false permite insertar registros históricos
  // (completados/entregados) sin que el validador de 15 días los rechace
  const pedidos = await Pedido.insertMany(pedidosData, { validateBeforeSave: false })
  console.log(`📋 ${pedidos.length} pedidos creados`)

  // ════════════════════════════════════════════════════════════════════════
  // ÓRDENES DE PRODUCCIÓN
  // ════════════════════════════════════════════════════════════════════════
  const ordenesData = []

  // Órdenes activas para los pedidos en producción
  const pedidosEnProd = pedidos.filter(p => p.estadoGeneral === 'en_produccion')

  for (const pedido of pedidosEnProd) {
    for (const linea of pedido.lineas) {
      if (linea.estado === 'en_produccion') {
        // Pedido grande: repartir entre 2 selladoras
        const selladoras = linea.cantidad > 4000
          ? [randNum(1, 3), randNum(3, 5)]
          : [randNum(1, 5)]

        const mitad = Math.floor(linea.cantidad / selladoras.length)

        for (let i = 0; i < selladoras.length; i++) {
          const refObj = referencias.find(r => r._id.toString() === linea.referencia.toString())
          ordenesData.push({
            pedido:           pedido._id,
            lineaPedidoId:    linea._id,
            referencia:       linea.referencia,
            selladora:        selladoras[i],
            cantidadAsignada: i === selladoras.length - 1
              ? linea.cantidad - mitad * (selladoras.length - 1)
              : mitad,
            procesos: refObj?.procesos || { extrusion: true, impresionRefilado: false, sellado: true },
            estado:   'en_proceso',
            creadoPor: rand(jefes)._id,
            reportes: [
              {
                operario:          rand(operarios)._id,
                numeroRollo:       `R-${randNum(1000, 9999)}`,
                horaInicio:        fechaPasada(randNum(4, 8)),
                horaFin:           fechaPasada(randNum(1, 3)),
                cantidadProducida: randNum(200, 800),
                desperdicio:       parseFloat((Math.random() * 5).toFixed(2)),
                observaciones:     rand(['Sin novedad', 'Cambio de rollo a mitad de turno', 'Velocidad reducida por calibre', '']),
              },
            ],
          })
        }
      }
    }
  }

  // Órdenes finalizadas para pedidos completados
  const pedidosComp = pedidos.filter(p => p.estadoGeneral === 'completado')
  for (const pedido of pedidosComp) {
    for (const linea of pedido.lineas) {
      const refObj = referencias.find(r => r._id.toString() === linea.referencia.toString())
      ordenesData.push({
        pedido:           pedido._id,
        lineaPedidoId:    linea._id,
        referencia:       linea.referencia,
        selladora:        randNum(1, 5),
        cantidadAsignada: linea.cantidad,
        procesos: refObj?.procesos || { extrusion: true, impresionRefilado: false, sellado: true },
        estado:   'finalizado',
        creadoPor: rand(jefes)._id,
        reportes: [
          {
            operario:          rand(operarios)._id,
            numeroRollo:       `R-${randNum(1000, 9999)}`,
            horaInicio:        fechaPasada(randNum(12, 24)),
            horaFin:           fechaPasada(randNum(6, 11)),
            cantidadProducida: linea.cantidad,
            desperdicio:       parseFloat((Math.random() * 8).toFixed(2)),
            observaciones:     'Producción completada sin inconvenientes',
          },
        ],
      })
    }
  }

  // Órdenes pendientes para algunos pedidos en espera
  const pedidosEspera = pedidos.filter(p => p.estadoGeneral === 'en_espera').slice(0, 1)
  for (const pedido of pedidosEspera) {
    for (const linea of pedido.lineas) {
      const refObj = referencias.find(r => r._id.toString() === linea.referencia.toString())
      ordenesData.push({
        pedido:           pedido._id,
        lineaPedidoId:    linea._id,
        referencia:       linea.referencia,
        selladora:        randNum(1, 5),
        cantidadAsignada: linea.cantidad,
        procesos: refObj?.procesos || { extrusion: true, impresionRefilado: false, sellado: true },
        estado:   'pendiente',
        creadoPor: rand(jefes)._id,
        reportes:  [],
      })
    }
  }

  await OrdenProduccion.insertMany(ordenesData)
  console.log(`⚙  ${ordenesData.length} órdenes de producción creadas`)

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════')
  console.log('  ✅ SEEDER COMPLETADO — Plastipack')
  console.log('══════════════════════════════════════')
  console.log(`  Usuarios:    ${usuarios.length}`)
  console.log(`  Referencias: ${referencias.length}`)
  console.log(`  Pedidos:     ${pedidos.length}`)
  console.log(`  Órdenes:     ${ordenesData.length}`)
  console.log('\n  Credenciales de acceso (todos usan password: 1234)')
  console.log('  ─────────────────────────────────────')
  usuarios.forEach(u => console.log(`  [${u.rol.padEnd(16)}]  ${u.email}`))
  console.log('══════════════════════════════════════\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en el seeder:', err)
  process.exit(1)
})