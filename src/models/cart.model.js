const mongoose = require('mongoose');
const cartCollection = "carts";

const itemCarrinhoSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const carrinhoSchema = new mongoose.Schema({
  items: [itemCarrinhoSchema],
});

const Carrinho = mongoose.model(cartCollection, carrinhoSchema);

module.exports = Carrinho;
