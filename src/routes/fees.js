const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/invoices', feeController.getInvoices);
router.get('/invoices/:id', feeController.getInvoices);
router.get('/structure', feeController.getFeeStructure);
router.get('/stats', authorize('super-admin', 'branch-admin', 'accountant'), feeController.getFeeStats);

router.post('/invoices', authorize('super-admin', 'branch-admin', 'accountant'), feeController.createInvoice);
router.post('/invoices/:id/payment', authorize('super-admin', 'branch-admin', 'accountant'), feeController.recordPayment);
router.post('/structure', authorize('super-admin', 'branch-admin'), feeController.createFeeStructure);

module.exports = router;
