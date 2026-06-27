const mongoose = require('mongoose');

const STAGES = ['cutting', 'stitching', 'finishing', 'packing'];

const bundleSchema = new mongoose.Schema({
  bundleId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
  quantity: { type: Number, required: true, min: 1 },
  currentStage: { type: String, enum: STAGES, default: 'cutting' },
  status: { type: String, enum: ['wip', 'packed'], default: 'wip' },
}, { timestamps: true });

module.exports = mongoose.model('Bundle', bundleSchema);
