//initialize the router
const express = require('express');
const router = express.Router();


//initialize the controllers
const authController = require('../controllers/auth');


//login
router.post('/login',authController.login);

module.exports = router;