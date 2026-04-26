const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

router.use(authenticate);
router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);
router.put('/change-password', authController.changePassword);

router.post('/register', authorize('super-admin', 'branch-admin'), authController.register);

module.exports = router;
