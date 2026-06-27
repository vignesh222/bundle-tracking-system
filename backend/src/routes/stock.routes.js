const router = require('express').Router();
const stock = require('../controllers/stock.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authenticate);
router.get('/', stock.list);
router.get('/movements', stock.movements);
router.post('/transfer', requireRole('manager'), stock.transfer);

module.exports = router;
