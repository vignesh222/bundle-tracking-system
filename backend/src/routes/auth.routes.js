const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');

router.post('/login', auth.login);
router.get('/profile', authenticate, auth.profile);

module.exports = router;
