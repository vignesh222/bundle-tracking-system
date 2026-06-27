const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  type: { type: String, enum: ['in', 'transfer', 'out'], required: true },
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
  fromLoc: { type: String, default: null },
  toLoc: { type: String, default: null },
  quantity: { type: Number, required: true, min: 1 },
  doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
