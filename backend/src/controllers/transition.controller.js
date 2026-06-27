const Bundle = require('../models/Bundle');
const StageTransition = require('../models/StageTransition');
const StockItem = require('../models/StockItem');
const StockMovement = require('../models/StockMovement');

const STAGE_ORDER = ['cutting', 'stitching', 'finishing', 'packing'];

exports.logTransition = async (req, res) => {
  try {
    const { bundleId, toStage, notes } = req.body;

    if (!bundleId || !toStage) {
      return res.status(400).json({ message: 'bundleId and toStage are required' });
    }

    if (!STAGE_ORDER.includes(toStage)) {
      return res.status(400).json({ message: 'Invalid stage' });
    }

    const bundle = await Bundle.findOne({ bundleId: bundleId.toUpperCase() });
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.status === 'packed') {
      return res.status(400).json({ message: 'Bundle is already packed and complete' });
    }

    const currentIdx = STAGE_ORDER.indexOf(bundle.currentStage);
    const toIdx = STAGE_ORDER.indexOf(toStage);

    if (toIdx !== currentIdx + 1) {
      return res.status(400).json({
        message: `Cannot transition from ${bundle.currentStage} to ${toStage}. Next stage must be ${STAGE_ORDER[currentIdx + 1]}`,
      });
    }

    const fromStage = bundle.currentStage;
    const isPacking = toStage === 'packing';

    // Optimistic lock: only update if currentStage still matches what we read
    const updated = await Bundle.findOneAndUpdate(
      { _id: bundle._id, currentStage: fromStage },
      { currentStage: toStage, ...(isPacking ? { status: 'packed' } : {}) },
      { returnDocument: 'after' }
    ).populate('styleId', 'name code');

    if (!updated) {
      return res.status(409).json({ message: 'Concurrent update conflict, please retry' });
    }

    const transition = await StageTransition.create({
      bundleId: bundle._id,
      fromStage,
      toStage,
      operatorId: req.user.userId,
      notes: notes || '',
    });

    if (isPacking) {
      await StockItem.findOneAndUpdate(
        { styleId: bundle.styleId, location: 'factory' },
        { $inc: { quantity: bundle.quantity } },
        { upsert: true, returnDocument: 'after' }
      );
      await StockMovement.create({
        type: 'in',
        styleId: bundle.styleId,
        toLoc: 'factory',
        quantity: bundle.quantity,
        doneBy: req.user.userId,
      });
    }

    res.json({ bundle: updated, transition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.history = async (req, res) => {
  try {
    const bundle = await Bundle.findOne({ bundleId: req.params.bundleId.toUpperCase() });
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    const transitions = await StageTransition.find({ bundleId: bundle._id })
      .populate('operatorId', 'name email')
      .sort('timestamp');
    res.json(transitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
