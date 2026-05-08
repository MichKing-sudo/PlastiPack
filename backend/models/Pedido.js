const mongoose = require('mongoose');

// Cada línea de un pedido es una referencia con su cantidad, valor y estado propio.
// Un pedido puede tener referencias en distintos estados al mismo tiempo.

const lineaPedidoSchema = new mongoose.Schema(
  {
    referencia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referencia',
      required: [true, 'La referencia es obligatoria'],
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    valorUnitario: {
      type: Number,
      required: [true, 'El valor unitario es obligatorio'],
      min: [0, 'El valor no puede ser negativo'],
    },
    // Estado individual por línea (una referencia puede estar en espera
    // mientras otra del mismo pedido ya está en producción)
    estado: {
      type: String,
      enum: ['en_espera', 'en_produccion', 'completado', 'entregado'],
      default: 'en_produccion', // al crear el pedido pasa directo a producción
    },
  },
  { _id: true }
);

const pedidoSchema = new mongoose.Schema(
  {
    numeroPedido: {
      type: String,
      unique: true,
    },
    // Vendedor que creó el pedido
    vendedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El vendedor es obligatorio'],
    },
    // Tipo de venta
    tipoVenta: {
      type: String,
      enum: ['almacen', 'personalizado'],
      required: [true, 'El tipo de venta es obligatorio'],
    },
    // Destino del pedido completo
    destino: {
      type: String,
      enum: ['interno', 'externo'],
      required: [true, 'El destino es obligatorio'],
    },
    // Nombre del cliente (si es externo)
    cliente: {
      type: String,
      trim: true,
      default: '',
    },
    // Fecha pactada: mínimo 15 días después de la fecha de creación
    fechaEntregaPactada: {
      type: Date,
      required: [true, 'La fecha de entrega pactada es obligatoria'],
      validate: {
        validator: function (fecha) {
          const hoy = new Date();
          const minFecha = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);
          return fecha >= minFecha;
        },
        message: 'La fecha de entrega debe ser al menos 15 días después de hoy',
      },
    },
    // Lista de referencias del pedido
    lineas: {
      type: [lineaPedidoSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'El pedido debe tener al menos una referencia',
      },
    },
    // Estado general del pedido (refleja el conjunto de estados de sus líneas)
    estadoGeneral: {
      type: String,
      enum: ['en_espera', 'en_produccion', 'completado', 'entregado'],
      default: 'en_produccion',
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-generar número de pedido antes de guardar
pedidoSchema.pre('save', async function () {
  if (!this.numeroPedido) {
    const count = await mongoose.model('Pedido').countDocuments();
    this.numeroPedido = `PED-${String(count + 1).padStart(5, '0')}`;
  }
});

// Calcular estadoGeneral automáticamente según las líneas
pedidoSchema.methods.recalcularEstado = function () {
  const estados = this.lineas.map((l) => l.estado);
  if (estados.every((e) => e === 'entregado'))       this.estadoGeneral = 'entregado';
  else if (estados.every((e) => e === 'completado' || e === 'entregado')) this.estadoGeneral = 'completado';
  else if (estados.some((e) => e === 'en_produccion')) this.estadoGeneral = 'en_produccion';
  else this.estadoGeneral = 'en_espera';
};

module.exports = mongoose.model('Pedido', pedidoSchema);