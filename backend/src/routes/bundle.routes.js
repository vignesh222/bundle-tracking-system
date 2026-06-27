const router = require('express').Router();
const bundle = require('../controllers/bundle.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authenticate);
router.get('/', bundle.list);
router.get('/:bundleId/qrcode', bundle.getQRCode);
router.get('/:bundleId', bundle.getOne);
router.post('/', requireRole('manager'), bundle.create);

module.exports = router;
