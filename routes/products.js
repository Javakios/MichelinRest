const express = require('express');

const router = express.Router();
const productsController = require('../controllers/products');

router.post('/getProducts',productsController.getAllProducts);
router.post('/addToCart',productsController.addToCart);
router.post('/fetchCart',productsController.fetchCart);
router.post('/removeCartItem',productsController.removeCartItem);
router.post('/updateProducts',productsController.updateProducts);
router.post('/updateStock',productsController.updateStock);
router.post('/updateModel',productsController.updateModel);
router.post('/updateMark',productsController.updateMark);
router.post('/updateManfctr',productsController.updateManfctr);
router.post('/updateGroup',productsController.updateGroup);
router.post('/updateCategories',productsController.updateCategories);
router.post('/clearCart',productsController.clearCart);
module.exports = router;
