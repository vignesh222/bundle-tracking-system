const router = require('express').Router();
const dashboard = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authenticate, requireRole('manager'));
router.get('/', dashboard.getDashboard);

module.exports = router;
