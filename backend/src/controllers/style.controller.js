const Style = require('../models/Style');

exports.create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const style = await Style.create({ name, code: code.toUpperCase(), description, createdBy: req.user.userId });
    res.status(201).json(style);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Style code already exists' });
    res.status(400).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const styles = await Style.find().populate('createdBy', 'name').sort('-createdAt');
    res.json(styles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const style = await Style.findById(req.params.id).populate('createdBy', 'name');
    if (!style) return res.status(404).json({ message: 'Style not found' });
    res.json(style);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
