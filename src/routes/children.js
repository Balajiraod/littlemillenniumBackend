const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeChildAccess } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', childController.getChildren);
router.get('/:id', authorizeChildAccess, childController.getChild);
router.get('/:id/qr', authorizeChildAccess, childController.getChildQR);
router.get('/:id/development', authorizeChildAccess, childController.getDevelopmentProfile);

router.post('/', authorize('super-admin', 'branch-admin'), childController.createChild);
router.put('/:id', authorize('super-admin', 'branch-admin'), childController.updateChild);
router.delete('/:id', authorize('super-admin', 'branch-admin'), childController.deleteChild);
router.put('/:id/development', authorize('super-admin', 'branch-admin', 'teacher'), childController.updateDevelopmentProfile);

module.exports = router;
