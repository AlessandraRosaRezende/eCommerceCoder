const Cart = require('../models/cart.model'); // Assumindo que você tem um modelo Cart
const Product = require('../models/product.model'); // Assumindo que você tem um modelo Product

// Renderiza a página do carrinho
const renderCart = async (req, res) => {
  try {
    const cartData = await Cart.findOne({ user: req.user._id }).populate('items.product').lean();
    console.log('Carrinho encontrado para renderização:', cartData);
    let cart = []; // Renomeie para 'cart'
    let totalPrice = 0;

    if (cartData && cartData.items.length > 0) {
      cart = cartData.items; // Renomeie para 'cart'
      totalPrice = cartData.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }
    console.log('Itens do carrinho para renderização:', cart); // Renomeie para 'cart'

    res.render('cart', { cart, totalPrice }); // Use 'cart' aqui
  } catch (error) {
    console.error('Erro ao renderizar o carrinho:', error);
    res.status(500).send('Erro ao carregar o carrinho.');
  }
};

// Diminui a quantidade de um item no carrinho
const decreaseQuantity = async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id, 'items.product': productId, 'items.quantity': { $gt: 1 } },
      { $inc: { 'items.$.quantity': -1 } },
      { new: true }
    );

    if (cart) {
      return res.redirect('/cart');
    }
    return res.redirect('/cart'); // Se a quantidade já era 1 ou o item não foi encontrado
  } catch (error) {
    console.error('Erro ao diminuir a quantidade:', error);
    res.status(500).send('Erro ao atualizar o carrinho.');
  }
};

// Remove um item do carrinho
const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { product: productId } } },
      { new: true }
    );
    res.redirect('/cart');
  } catch (error) {
    console.error('Erro ao remover o item do carrinho:', error);
    res.status(500).send('Erro ao remover o item.');
  }
};

// Esvazia o carrinho
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.redirect('/cart');
  } catch (error) {
    console.error('Erro ao esvaziar o carrinho:', error);
    res.status(500).send('Erro ao esvaziar o carrinho.');
  }
};

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const userId = req.user._id;
    // Lógica para adicionar o produto ao carrinho do usuário
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Se o carrinho não existir, cria um novo
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      // Se o item já existe, aumenta a quantidade
      existingItem.quantity += parseInt(quantity);
    } else {
      // Se o item não existe, adiciona um novo
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    console.log('Carrinho antes de salvar:', cart); // Adicione este log
    await cart.save();
    console.log('Carrinho depois de salvar:', cart); // Adicione este log

    res.redirect('/cart'); // Redireciona para a página do carrinho após adicionar
    // Ou você pode enviar uma resposta JSON de sucesso
    // res.status(200).json({ message: 'Produto adicionado ao carrinho com sucesso!' });

  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).send('Erro ao adicionar o produto ao carrinho.');
  }
};

module.exports = {
  renderCart,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  addToCart,
};