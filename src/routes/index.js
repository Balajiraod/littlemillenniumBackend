const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/children', require('./children'));
router.use('/teachers', require('./teachers'));
router.use('/attendance', require('./attendance'));
router.use('/fees', require('./fees'));
router.use('/reports', require('./reports'));
router.use('/dashboard', require('./dashboard'));
router.use('/branches', require('./branches'));
router.use('/activities', require('./activities'));

module.exports = router;
