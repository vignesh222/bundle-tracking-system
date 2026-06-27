const QRCode = require('qrcode');
const Bundle = require('../models/Bundle');

exports.create = async (req, res) => {
  try {
    const { bundleId, styleId, quantity } = req.body;
    if (!bundleId || !styleId || !quantity) {
      return res.status(400).json({ message: 'bundleId, styleId, and quantity are required' });
    }
    const bundle = await Bundle.create({ bundleId: bundleId.toUpperCase(), styleId, quantity });
    const populated = await bundle.populate('styleId', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Bundle ID already exists' });
    res.status(400).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { status, stage } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (stage) filter.currentStage = stage;
    const bundles = await Bundle.find(filter).populate('styleId', 'name code').sort('-createdAt');
    res.json(bundles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const bundle = await Bundle.findOne({ bundleId: req.params.bundleId.toUpperCase() }).populate('styleId', 'name code');
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQRCode = async (req, res) => {
  try {
    const bundle = await Bundle.findOne({ bundleId: req.params.bundleId.toUpperCase() });
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    const dataUrl = await QRCode.toDataURL(bundle.bundleId, {
      width: 300,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    const img = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(img);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
