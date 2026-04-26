const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.get('/daily/:date', attendanceController.getDailyReport);
router.get('/child/:id', attendanceController.getChildAttendance);

router.post('/mark', authorize('super-admin', 'branch-admin', 'teacher'), attendanceController.markAttendance);

module.exports = router;
