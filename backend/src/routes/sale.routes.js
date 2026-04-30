// sale.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);

module.exports = router;
