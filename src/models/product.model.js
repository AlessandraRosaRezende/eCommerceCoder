const mongoose = require('mongoose');
const productCollection = "products";

const produtoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  imagemURL: { type: String },
});

const Produto = mongoose.model(productCollection, produtoSchema);

module.exports = Produto;
