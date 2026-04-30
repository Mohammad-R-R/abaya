const router = require('express').Router();
const ctrl = require('../controllers/abaya.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { uploadAbayaImages } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/low-stock', ctrl.getLowStock);
router.get('/:id', ctrl.getOne);
router.post('/', uploadAbayaImages.array('images', 5), ctrl.create);
router.put('/:id', uploadAbayaImages.array('images', 5), ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);
router.delete('/:id/images/:imageId', ctrl.deleteImage);

module.exports = router;
