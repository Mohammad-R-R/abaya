const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/overview', ctrl.getOverview);
router.get('/profit-loss', ctrl.getProfitLoss);
router.get('/sales-chart', ctrl.getSalesChart);
router.get('/category-breakdown', ctrl.getCategoryBreakdown);

module.exports = router;
