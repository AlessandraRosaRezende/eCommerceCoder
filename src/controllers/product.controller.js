// src/controllers/product.controller.js
const Product = require('../models/product.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');

const renderProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const user = await User.findById(req.user._id).lean();
    console.log(user);
    res.render('products', { title: 'Lista de Produtos', products, user: user });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).send('Erro ao carregar a lista de produtos.');
  }
};

const renderRealTimeProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.render('realtimeproducts', { title: 'Produtos em Tempo Real', products });
  } catch (error) {
    console.error('Erro ao buscar produtos em tempo real:', error);
    res.status(500).send('Erro ao carregar a lista de produtos em tempo real.');
  }
};

const getProductDetails = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId).lean();
    if (product) {
      res.render('productDetails', { title: product.title, product });
    } else {
      res.status(404).send('Produto não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao obter detalhes do produto:', error);
    res.status(500).send('Erro ao carregar os detalhes do produto.');
  }
};

const renderAddProduct = (req, res) => {
  res.render('addProduct', { title: 'Adicionar Produto' });
};

const addProduct = async (req, res) => {
  try {
    const { title, description, price, code, stock, category } = req.body;

    const newProduct = new Product({
      title,
      description,
      price: parseFloat(price),
      code,
      stock: parseInt(stock),
      category,
      owner: req.user._id
    });

    const savedProduct = await newProduct.save();
    const io = req.app.io;
    if (io) {
      const products = await Product.find(); // Busca a lista atualizada de produtos
      io.emit('addProduct', products);
    } else {
      console.error('WebSocket (io) não está disponível');
    }
    res.redirect('/products');
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).send('Erro ao adicionar produto.');
  }
};

const renderEditProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).send('Produto não encontrado');
    }
    res.render('editProduct', { product });
  } catch (error) {
    console.error('Erro ao renderizar página de edição:', error);
    res.status(500).send('Erro ao carregar a página de edição.');
  }
};

const editProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const { title, description, price, code, stock, category } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { title, description, price: parseFloat(price), code, stock: parseInt(stock), category },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send('Produto não encontrado.');
    }
    const io = req.app.io;
    if (io) {
      const products = await Product.find(); // Busca a lista atualizada de produtos
      io.emit('editProduct', products);
    }
    res.redirect('/realtimeproducts');
  } catch (error) {
    console.error('Erro ao editar produto:', error);
    res.status(500).send('Erro ao editar produto.');
  }
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Produto não encontrado.');
    }

    if (product.owner && product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).send('Você não tem permissão para excluir este produto.');
    }

    await Product.findByIdAndDelete(productId);
    const io = req.app.io;
    if (io) {
      const products = await Product.find(); // Busca a lista atualizada de produtos
      io.emit('deleteProduct', products);
    }
    res.redirect('/realtimeproducts');
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).send('Erro ao excluir produto.');
  }
};

// Renderiza o formulário de cadastro de novo produto
const renderNewProductForm = (req, res) => {
  res.render('admin/newProduct'); // Crie esta view
};

module.exports = {
  renderProducts,
  renderRealTimeProducts,
  getProductDetails,
  renderAddProduct,
  addProduct,
  renderEditProduct,
  editProduct,
  deleteProduct,
};