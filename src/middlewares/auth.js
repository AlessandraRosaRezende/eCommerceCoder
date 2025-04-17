const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login'); // Redirecionar para a página de login se não estiver autenticado
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Acesso não autorizado.');
};

const isPremium = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'premium') {
    return next();
  }
  return res.status(403).send('Acesso não autorizado. Requer conta Premium.');
};

const isUser = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'user') {
    return next();
  }
  return res.status(403).send('Acesso não autorizado. Requer conta de Usuário.');
};

const isUserOrPremium = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.role === 'user' || req.user.role === 'premium')) {
    return next();
  }
  return res.status(403).send('Acesso não autorizado.');
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isPremium,
  isUser,
  isUserOrPremium,
};