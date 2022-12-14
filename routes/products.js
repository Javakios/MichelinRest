const express = require('express');

const router = express.Router();
const productsController = require('../controllers/products');

router.post('/getProducts',productsController.getAllProducts);
router.post('/addToCart',productsController.addToCart);
router.post('/fetchCart',productsController.fetchCart);
router.post('/removeCartItem',productsController.removeCartItem);

module.exports = router;
