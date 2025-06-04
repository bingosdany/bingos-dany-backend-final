const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  cantidad: Number,
  comprobante: String, // ✅ Comprobante subido (nombre del archivo)
  fecha: {
    type: Date,
    default: Date.now
  },
  validado: {
    type: Boolean,
    default: false // ✅ Campo nuevo para controlar si ya fue validado
  }
});

module.exports = mongoose.model('Reserva', reservaSchema);
