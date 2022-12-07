const express = require('express');

const router = express.Router();
const productsController = require('../controllers/products');

router.post('/getProducts',productsController.getAllProducts)

module.exports = router;
