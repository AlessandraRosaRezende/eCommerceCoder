const express = require('express');
const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');

const router = express.Router();

// Obter o carrinho do usuário
router.get("/cart", async (req, res) => {
  try {
    const cart = await cartModel.findOne(); // Obtém o carrinho do MongoDB
    console.log(cart);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.render("cart", { title: "Carrinho", cart: [] });
    } else {
      let productsInCart = await productModel.find({ '_id': { $in: cart.items.map(item => item.productId) } });
      productsInCart = productsInCart.map(product => {
        const item = cart.items.find(item => item.productId.toString() === product._id.toString());
        return {
          ...product.toJSON(),
          quantity: item.quantity,
        };
      });
      return res.render("cart", { title: "Carrinho", cart: productsInCart });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao buscar carrinho.");
  }
});

// Adicionar produto ao carrinho
router.post("/cart", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log(req.body);

    const product = await productModel.findById(productId); // Encontra o produto pelo ID
    if (!product) {
      return res.status(404).send("Produto não encontrado.");
    }

    const cart = await cartModel.findOne();  // Obtém o carrinho
    if (!cart) {
      const newCart = await new cartModel({
        items: [{ productId, quantity }]
      });
      await newCart.save();  // Cria um novo carrinho
    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        existingItem.quantity += parseInt(quantity);
      } else {
        cart.items.push({ productId, quantity });
      }
      await cart.save();  // Atualiza o carrinho no MongoDB
    }

    const io = req.app.io;
    if (io) {
      io.emit("updateCart", await cartModel.findOne()); // Emite o carrinho atualizado
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao adicionar produto ao carrinho.");
  }
});

// Esvaziar carrinho
router.post("/clearcart", async (req, res) => {
  try {
    await cartModel.deleteOne();  // Esvazia o carrinho no MongoDB
    const io = req.app.io;
    if (io) {
      io.emit("clearCart", []);
    }
    res.redirect("/realtimeproducts");
  } catch (error) {
    res.status(500).send("Erro ao esvaziar carrinho.");
  }
});

// Rota para diminuir a quantidade de um produto no carrinho
router.post("/decreaseQuantity/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await cartModel.findOne(); // Obtém o carrinho
    if (!cart) {
      return res.status(404).send("Carrinho não encontrado.");
    }

    // Busca o item no carrinho
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).send("Produto não encontrado no carrinho.");
    }

    // Reduz a quantidade ou remove o produto se for a última unidade
    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1); // Remove o produto do carrinho
    }

    // Salva o carrinho atualizado no banco de dados
    await cart.save();

    // Emite o evento WebSocket para atualizar os clientes
    const io = req.app.io;
    if (io) {
      io.emit("updateCart", cart);
    }

    res.redirect("/cart"); // Redireciona para a página do carrinho
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao diminuir quantidade do produto.");
  }
});

// Rota para remover um produto do carrinho
router.post("/removeFromCart/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await cartModel.findOne(); // Obtém o carrinho
    if (!cart) {
      return res.status(404).send("Carrinho não encontrado.");
    }

    // Remove o produto do carrinho filtrando os itens
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // Salva o carrinho atualizado no banco de dados
    await cart.save();

    // Emite o evento WebSocket para atualizar os clientes
    const io = req.app.io;
    if (io) {
      io.emit("updateCart", cart);
    }

    res.redirect("/cart"); // Redireciona para a página do carrinho
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao remover produto do carrinho.");
  }
});

module.exports = router;
