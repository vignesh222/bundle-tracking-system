const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema({
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
  location: { type: String, enum: ['factory', 'dispatch'], required: true },
  quantity: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
});

stockItemSchema.index({ styleId: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('StockItem', stockItemSchema);
