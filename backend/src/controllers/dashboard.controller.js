const Bundle = require('../models/Bundle');
const StockItem = require('../models/StockItem');
const StageTransition = require('../models/StageTransition');

exports.getDashboard = async (req, res) => {
  try {
    const [wipByStage, stockItems, totalBundles, packedBundles, recentTransitions] = await Promise.all([
      Bundle.aggregate([
        { $match: { status: 'wip' } },
        { $group: { _id: '$currentStage', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      ]),
      StockItem.find().populate('styleId', 'name code'),
      Bundle.countDocuments(),
      Bundle.countDocuments({ status: 'packed' }),
      StageTransition.find()
        .populate('bundleId', 'bundleId')
        .populate('operatorId', 'name')
        .sort('-timestamp')
        .limit(10),
    ]);

    res.json({
      wipByStage,
      stockItems,
      totalBundles,
      packedBundles,
      wipBundles: totalBundles - packedBundles,
      recentTransitions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
