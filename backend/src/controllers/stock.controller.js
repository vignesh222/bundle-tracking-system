const StockItem = require('../models/StockItem');
const StockMovement = require('../models/StockMovement');

exports.list = async (req, res) => {
  try {
    const items = await StockItem.find().populate('styleId', 'name code');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { styleId, fromLoc, toLoc, quantity } = req.body;

    if (!styleId || !fromLoc || !toLoc || !quantity) {
      return res.status(400).json({ message: 'styleId, fromLoc, toLoc, and quantity are required' });
    }

    if (fromLoc === toLoc) {
      return res.status(400).json({ message: 'Source and destination must be different' });
    }

    if (!['factory', 'dispatch'].includes(fromLoc) || !['factory', 'dispatch'].includes(toLoc)) {
      return res.status(400).json({ message: 'Invalid location. Use factory or dispatch' });
    }

    const qty = Number(quantity);
    if (qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check and decrement source atomically — no negative stock
    const source = await StockItem.findOneAndUpdate(
      { styleId, location: fromLoc, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { returnDocument: 'after' }
    );

    if (!source) {
      const current = await StockItem.findOne({ styleId, location: fromLoc });
      return res.status(400).json({
        message: `Insufficient stock. Available: ${current?.quantity ?? 0}`,
      });
    }

    await StockItem.findOneAndUpdate(
      { styleId, location: toLoc },
      { $inc: { quantity: qty } },
      { upsert: true, returnDocument: 'after' }
    );

    await StockMovement.create({
      type: 'transfer',
      styleId,
      fromLoc,
      toLoc,
      quantity: qty,
      doneBy: req.user.userId,
    });

    res.json({ message: 'Transfer successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.movements = async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate('styleId', 'name code')
      .populate('doneBy', 'name')
      .sort('-timestamp')
      .limit(50);
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
