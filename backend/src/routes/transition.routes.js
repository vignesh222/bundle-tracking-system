const router = require('express').Router();
const transition = require('../controllers/transition.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/', transition.logTransition);
router.get('/:bundleId/history', transition.history);

module.exports = router;
