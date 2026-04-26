const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/admin-stats', authorize('super-admin', 'branch-admin'), dashboardController.getAdminStats);
router.get('/attendance-trend', authorize('super-admin', 'branch-admin'), dashboardController.getAttendanceTrend);
router.get('/enrollment-by-grade', dashboardController.getEnrollmentByGrade);
router.get('/revenue-trend', authorize('super-admin', 'branch-admin', 'accountant'), dashboardController.getRevenueTrend);
router.get('/branch-stats', authorize('super-admin'), dashboardController.getBranchStats);
router.get('/parent', authorize('parent'), dashboardController.getParentDashboard);

module.exports = router;
