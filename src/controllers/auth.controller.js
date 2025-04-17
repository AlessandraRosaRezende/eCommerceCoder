// src/controllers/auth.controller.js
const User = require('../models/user.model');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');

// Renderiza a página de login
const renderLogin = (req, res) => {
  res.render('login', { message: req.flash('loginMessage'), error: req.query.error });
};

// Renderiza a página de registro
const renderRegister = (req, res) => {
  res.render('register');
};

// Lógica de registro
const register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'E-mail já registrado.' });
    }
    const newUser = new User({ first_name, last_name, email, password });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.render('register', { error: 'Erro ao criar conta.' });
  }
};

// Lógica de logout
const logout = (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
};

// Renderiza a página de "Esqueci a Senha"
const renderForgotPassword = (req, res) => {
  res.render('forgot-password', { message: req.flash('forgotMessage') });
};

// Lógica para solicitar a redefinição de senha
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('forgotMessage', 'Nenhum usuário encontrado com este e-mail.');
      return res.redirect('/forgot-password');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    const resetLink = `http://localhost:8080/reset-password/${token}`;
    const htmlContent = `
            <p>Você solicitou a redefinição da sua senha.</p>
            <p>Clique no link abaixo para prosseguir:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este link é válido por 1 hora.</p>
            <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
        `;

    await sendEmail(email, 'Redefinição de Senha', htmlContent);
    req.flash('forgotMessage', 'Um e-mail com as instruções para redefinir sua senha foi enviado para ' + email + '.');
    res.redirect('/forgot-password');

  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    req.flash('forgotMessage', 'Ocorreu um erro ao processar sua solicitação.');
    res.redirect('/forgot-password');
  }
};

// Renderiza a página de redefinição de senha
const renderResetPassword = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      req.flash('loginMessage', 'Token de redefinição de senha inválido ou expirado.');
      return res.redirect('/login');
    }
    res.render('reset-password', { token, message: req.flash('resetMessage') });
  } catch (error) {
    console.error('Erro ao renderizar página de redefinição de senha:', error);
    req.flash('loginMessage', 'Ocorreu um erro ao processar sua solicitação.');
    res.redirect('/login');
  }
};

// Lógica para redefinir a senha
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.flash('resetMessage', 'As senhas não coincidem.');
    return res.redirect(`/reset-password/${token}`);
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('loginMessage', 'Token de redefinição de senha inválido ou expirado.');
      return res.redirect('/login');
    }

    if (await bcrypt.compare(password, user.password)) {
      req.flash('resetMessage', 'A nova senha não pode ser a mesma que a senha antiga.');
      return res.redirect(`/reset-password/${token}`);
    }

    user.password = password; // A senha será hasheada pelo middleware 'pre' no modelo User
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('loginMessage', 'Sua senha foi redefinida com sucesso. Faça login com sua nova senha.');
    res.redirect('/login');

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    req.flash('loginMessage', 'Ocorreu um erro ao redefinir sua senha.');
    res.redirect(`/reset-password/${token}`);
  }
};

module.exports = {
  renderLogin,
  renderRegister,
  register,
  logout,
  renderForgotPassword,
  forgotPassword,
  renderResetPassword,
  resetPassword
};