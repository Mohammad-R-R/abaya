const router = require('express').Router();
const ctrl = require('../controllers/import.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { uploadExcel } = require('../middleware/upload.middleware');

router.get('/template', ctrl.downloadTemplate);
router.post('/preview', authenticate, uploadExcel.single('file'), ctrl.preview);
router.post('/import', authenticate, requireAdmin, uploadExcel.single('file'), ctrl.importData);

module.exports = router;
