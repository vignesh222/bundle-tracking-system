const mongoose = require('mongoose');

const stageTransitionSchema = new mongoose.Schema({
  bundleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle', required: true },
  fromStage: { type: String, required: true },
  toStage: { type: String, required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StageTransition', stageTransitionSchema);
