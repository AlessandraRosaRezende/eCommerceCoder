const express = require('express');
const cartController = require('../controllers/cart.controller');
const { isAuthenticated } = require('../middlewares/auth'); // Se as rotas exigem autenticação

const router = express.Router();

// Rota para exibir o carrinho
router.get('/', isAuthenticated, cartController.renderCart);

// Rota para adicionar um item ao carrinho (POST)
router.post('/', isAuthenticated, cartController.addToCart);

// Rota para diminuir a quantidade de um item
router.post('/decreaseQuantity/:productId', isAuthenticated, cartController.decreaseQuantity);

// Rota para remover um item do carrinho
router.post('/removeFromCart/:productId', isAuthenticated, cartController.removeFromCart);

// Rota para esvaziar o carrinho
router.post('/clearCart', isAuthenticated, cartController.clearCart);

module.exports = router;