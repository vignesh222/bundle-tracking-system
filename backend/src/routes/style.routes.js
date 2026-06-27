const router = require('express').Router();
const style = require('../controllers/style.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authenticate);
router.get('/', style.list);
router.get('/:id', style.getOne);
router.post('/', requireRole('manager'), style.create);

module.exports = router;
