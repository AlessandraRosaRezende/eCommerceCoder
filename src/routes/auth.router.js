// src/routes/auth.router.js
const express = require('express');
const passport = require('../config/passport.config');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// Rota para a página inicial (redireciona para /login)
router.get('/', (req, res) => {
  res.redirect('/login');
  // Ou, para renderizar a página de login diretamente:
  // authController.renderLogin(req, res);
});

router.get('/register', authController.renderRegister);
router.post('/register', authController.register);
router.get('/login', authController.renderLogin);
router.post('/login', passport.authenticate('login', {
  failureRedirect: '/login?error=Usuário ou senha inválidos',
  successRedirect: '/products',
  failureFlash: true,
}));
router.get('/logout', authController.logout);

// Rotas para autenticação com GitHub
router.get('/github', passport.authenticate('github'));
router.get('/api/sessions/githubcallback', passport.authenticate('github', {
  failureRedirect: '/login?error=Erro ao autenticar com GitHub',
  successRedirect: '/products'
}));

router.get('/forgot-password', authController.renderForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.renderResetPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;