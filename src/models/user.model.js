// src/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, unique: true, index: true },
  password: { type: String }, // Será hasheada antes de salvar
  githubId: { type: String, unique: true, sparse: true }, // Para autenticação com GitHub
  role: { type: String, enum: ['user', 'premium', 'admin'], default: 'user' },
  last_connection: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Middleware para hashear a senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Método para comparar senhas (para login)
UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);