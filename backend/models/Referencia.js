const mongoose = require('mongoose');

// Una referencia es cada variación única de producto que maneja Plastipack.
// La empresa maneja ~150.000 referencias activas.

const referenciaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código de referencia es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['bolsa', 'rollo', 'lamina'],
      required: [true, 'El tipo de producto es obligatorio'],
    },
    materiaPrima: {
      type: String,
      required: [true, 'La materia prima es obligatoria'],
      trim: true,
    },
    // Dimensiones y características técnicas
    dimensiones: {
      ancho:  { type: Number, required: [true, 'El ancho es obligatorio'], min: 0 },
      largo:  { type: Number, required: [true, 'El largo es obligatorio'], min: 0 },
      calibre: { type: Number, min: 0 }, // grosor en micras
      unidad: { type: String, default: 'cm' },
    },
    // Si lleva impresión (logo del cliente) o sale sin marca
    conImpresion: {
      type: Boolean,
      default: false,
    },
    // Destino del producto
    destino: {
      type: String,
      enum: ['interno', 'externo'],
      required: [true, 'El destino es obligatorio'],
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    // Procesos que aplican a esta referencia
    procesos: {
      extrusion:  { type: Boolean, default: true },  // siempre obligatorio
      impresionRefilado: { type: Boolean, default: false }, // opcional según referencia
      sellado:    { type: Boolean, default: true },  // generalmente obligatorio
    },
    // Creado por el jefe de producción
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referencia', referenciaSchema);