const express = require('express');

const router = express.Router();
const orderController = require('../controllers/order');

router.post('/order',orderController.xmlReq);
router.post('/placeOrder',orderController.order);
router.post('/test',orderController.test);
router.post('/getOrders',orderController.getOrders);
module.exports = router;
