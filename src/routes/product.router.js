// src/routes/product.router.js
const express = require('express');
const productController = require('../controllers/product.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Rota para obter todos os produtos (para a view principal)
router.get('/', isAuthenticated, productController.renderProducts);

// Rota para obter produtos em tempo real (para Socket.IO)
router.get('/realtimeproducts', productController.renderRealTimeProducts);

// Rota para exibir detalhes de um produto
router.get('/:id', productController.getProductDetails);

// Rota para exibir o formulário de adicionar produto
router.get('/admin/addproduct', isAuthenticated, isAdmin, productController.renderAddProduct);

// Rota para adicionar um novo produto (com Socket.IO)
router.post('/admin/addproduct', isAuthenticated, isAdmin, productController.addProduct);

// Rota para exibir o formulário de edição de produto
router.get('/admin/editproduct/:id', isAuthenticated, isAdmin, productController.renderEditProduct);

// Rota para editar um produto existente (com Socket.IO)
router.post('/admin/editproduct/:id', isAuthenticated, isAdmin, productController.editProduct);

// Rota para excluir um produto (com Socket.IO)
router.post('/admin/deleteproduct/:id', isAuthenticated, isAdmin, productController.deleteProduct);

module.exports = router;