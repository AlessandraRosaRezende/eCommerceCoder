// src/models/product.model.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  code: { type: String, required: true, unique: true, index: true },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Referência ao modelo de usuário que criou o produto
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);