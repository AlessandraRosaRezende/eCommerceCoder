const express = require('express');
const orderController = require('../controllers/order.controller');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.get('/checkout', isAuthenticated, orderController.renderCheckout);
router.post('/', isAuthenticated, orderController.processOrder);
router.get('/success/:orderId', isAuthenticated, orderController.renderOrderSuccess);

module.exports = router;