const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const sendEmail = require('../utils/sendEmail');

const renderCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    res.render('checkout', { cartItems: cart.items, cartTotal: cart.total });
  } catch (error) {
    console.error('Erro ao renderizar checkout:', error);
    res.status(500).send('Erro ao carregar a página de checkout.');
  }
};

const processOrder = async (req, res) => {
  const { address, payment_method } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    const newOrder = new Order({
      user: req.user._id,
      items: orderItems,
      total: cart.total,
      address,
      payment_method,
      status: 'pending' // Status inicial do pedido
    });

    const savedOrder = await newOrder.save();

    // Limpar o carrinho do usuário após o pedido ser criado
    await Cart.deleteOne({ user: req.user._id });

    // Enviar e-mail de confirmação do pedido
    const orderDetails = orderItems.map(item => `${item.product.title} x ${item.quantity}`).join('<br>');
    const htmlContent = `
            <h1>Seu Pedido Foi Recebido!</h1>
            <p>Olá ${req.user.first_name} ${req.user.last_name},</p>
            <p>Obrigado por sua compra. Seu pedido número é: <strong>${savedOrder._id}</strong>.</p>
            <h2>Detalhes do Pedido:</h2>
            ${orderDetails}
            <p><strong>Total do Pedido: R$ ${savedOrder.total}</strong></p>
            <p>Endereço de Entrega: ${address}</p>
            <p>Método de Pagamento: ${payment_method}</p>
            <p>Aguarde atualizações sobre o status do seu pedido.</p>
        `;
    await sendEmail(req.user.email, 'Confirmação do Seu Pedido', htmlContent);

    res.redirect(`/orders/success/${savedOrder._id}`);

  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    res.status(500).send('Erro ao processar o pedido.');
  }
};

const renderOrderSuccess = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findById(orderId).populate('items.product');
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.redirect('/products'); // Redirecionar se o pedido não pertencer ao usuário
    }
    res.render('order-success', { order });
  } catch (error) {
    console.error('Erro ao renderizar página de sucesso do pedido:', error);
    res.status(500).send('Erro ao carregar a página de sucesso.');
  }
};

module.exports = {
  renderCheckout,
  processOrder,
  renderOrderSuccess
};