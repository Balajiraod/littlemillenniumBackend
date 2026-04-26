const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', reportController.getReports);
router.get('/:id', reportController.getReport);

router.post('/generate/weekly', authorize('super-admin', 'branch-admin', 'teacher'), reportController.generateWeeklyReport);
router.put('/:id', authorize('super-admin', 'branch-admin', 'teacher'), reportController.updateReport);
router.post('/:id/publish', authorize('super-admin', 'branch-admin'), reportController.publishReport);
router.post('/:id/acknowledge', authorize('parent'), reportController.acknowledgeReport);

module.exports = router;
