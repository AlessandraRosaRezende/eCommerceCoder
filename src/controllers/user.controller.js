const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail'); // Assumindo que você tem esta função

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('first_name last_name email role');
    res.json(users);
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ error: 'Erro ao obter usuários.' });
  }
};

const deleteInactiveUsers = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)); // 2 dias em milissegundos
    // Para teste com 30 minutos:
    // const cutoff = new Date(Date.now() - (30 * 60 * 1000));

    const inactiveUsers = await User.find({ last_connection: { $lt: cutoff } });

    for (const user of inactiveUsers) {
      await sendEmail(user.email, 'Conta Excluída por Inatividade', 'Sua conta em nosso e-commerce foi excluída devido à inatividade.');
    }

    const result = await User.deleteMany({ last_connection: { $lt: cutoff } });
    res.json({ message: `${result.deletedCount} usuários inativos excluídos.` });
  } catch (error) {
    console.error('Erro ao excluir usuários inativos:', error);
    res.status(500).json({ error: 'Erro ao excluir usuários inativos.' });
  }
};

const renderAdminUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render('users', { users });
  } catch (error) {
    console.error('Erro ao renderizar página de usuários:', error);
    res.status(500).send('Erro ao carregar a página de usuários.');
  }
};

const renderEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    res.render('edit-user', { user });
  } catch (error) {
    console.error('Erro ao renderizar página de edição de usuário:', error);
    res.status(500).send('Erro ao carregar a página de edição de usuário.');
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, email, role } = req.body;
    await User.findByIdAndUpdate(userId, { first_name, last_name, email, role });
    res.redirect('/users');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).send('Erro ao atualizar usuário.');
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.redirect('/users');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).send('Erro ao excluir usuário.');
  }
};

module.exports = {
  getAllUsers,
  deleteInactiveUsers,
  renderAdminUsers,
  renderEditUser,
  updateUser,
  deleteUserAdmin,
};