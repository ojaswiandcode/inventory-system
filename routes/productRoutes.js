const express = require('express');
const ctrl = require('../controllers/productController');
const { validateId, requireBody, validateStockChange } = require('../middleware/validate');

const router = express.Router();

// NOTE: fixed paths (/low-stock, /summary) must come BEFORE '/:id'
router.get('/low-stock', ctrl.getLowStock);
router.get('/summary', ctrl.getCategorySummary);

router.route('/')
  .get(ctrl.getProducts)
  .post(requireBody, ctrl.createProduct);

router.patch('/:id/stock', validateId, validateStockChange, ctrl.adjustStock);

router.route('/:id')
  .get(validateId, ctrl.getProductById)
  .put(validateId, requireBody, ctrl.updateProduct)
  .delete(validateId, ctrl.deleteProduct);

module.exports = router;
