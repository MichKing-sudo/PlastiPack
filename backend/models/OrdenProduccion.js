const mongoose = require('mongoose');

// Reporte que registra el operario al finalizar su turno en una selladora.
// Una misma referencia puede repartirse entre varias selladoras (pedidos grandes).

const reporteTurnoSchema = new mongoose.Schema(
  {
    operario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    numeroRollo: {
      type: String,
      trim: true,
    },
    horaInicio: {
      type: Date,
    },
    horaFin: {
      type: Date,
    },
    cantidadProducida: {
      type: Number,
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },
    desperdicio: {
      type: Number,   // en kg
      min: [0, 'El desperdicio no puede ser negativo'],
      default: 0,
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { _id: true, timestamps: true }
);

const ordenProduccionSchema = new mongoose.Schema(
  {
    // Pedido al que pertenece esta orden
    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pedido',
      required: [true, 'El pedido es obligatorio'],
    },
    // Línea específica del pedido (referencia a producir)
    lineaPedidoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'La línea del pedido es obligatoria'],
    },
    referencia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referencia',
      required: [true, 'La referencia es obligatoria'],
    },
    // Selladora asignada (1 al 5)
    selladora: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: [true, 'La selladora es obligatoria'],
    },
    // Cantidad asignada a esta selladora para esta referencia
    cantidadAsignada: {
      type: Number,
      required: [true, 'La cantidad asignada es obligatoria'],
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    // Procesos que aplican a esta orden
    procesos: {
      extrusion:         { type: Boolean, default: true },
      impresionRefilado: { type: Boolean, default: false },
      sellado:           { type: Boolean, default: true },
    },
    estado: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'finalizado'],
      default: 'pendiente',
    },
    // Reportes del operario (puede haber varios turnos)
    reportes: [reporteTurnoSchema],
    // Jefe de producción que generó la orden
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrdenProduccion', ordenProduccionSchema);