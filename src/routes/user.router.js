const express = require('express');
const userController = require('../controllers/user.controller');
const { isAdmin } = require('../middlewares/auth'); // Middleware para verificar se o usuário é admin
const router = express.Router();

router.get('/', userController.getAllUsers);
router.delete('/', userController.deleteInactiveUsers);

// Rotas protegidas por autenticação de administrador
router.get('/admin/users', isAdmin, userController.renderAdminUsers);
router.get('/admin/users/edit/:id', isAdmin, userController.renderEditUser);
router.put('/admin/users/:id', isAdmin, userController.updateUser);
router.delete('/admin/users/:id', isAdmin, userController.deleteUserAdmin);

module.exports = router;