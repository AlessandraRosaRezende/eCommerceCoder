const express = require("express");
const path = require("path");
const { readFile, writeFile } = require("../utils");

const router = express.Router();
const cartPath = path.join(__dirname, "../data/cart.json");
const productsPath = path.join(__dirname, "../data/products.json");

router.get("/cart", (req, res) => {
  const cart = readFile(cartPath);
  res.render("cart", { title: "Carrinho", cart });
});

router.post("/cart", (req, res) => {
  const products = readFile(productsPath);
  const cart = readFile(cartPath);

  const product = products.find((p) => p.id === parseInt(req.body.productId));
  if (!product) {
    return res.status(404).send("Produto não encontrado.");
  }

  const existingProduct = cart.find((item) => item.id === product.id);
  if (existingProduct) {
    existingProduct.quantity += parseInt(req.body.quantity);
  } else {
    cart.push({ ...product, quantity: parseInt(req.body.quantity) });
  }

  writeFile(cartPath, cart);
  const io = req.app.io; // Obtém o objeto io do app
  if (io) {
    io.emit("updateCart", products);
  } else {
    console.error("WebSocket (io) não está disponível");
  }
  res.redirect("/cart");
});

// Rota para esvaziar o carrinho
router.post("/clearcart", (req, res) => {
  console.log("Requisição para esvaziar carrinho recebida");

  try {
    // Esvaziar o carrinho gravando um array vazio
    const updatedCart = [];
    writeFile(cartPath, updatedCart);

    // Emissão do evento para todos os clientes (atualização do carrinho)
    const io = req.app.io;
    if (io) {
      io.emit("clearCart", updatedCart); // Envia o carrinho atualizado para todos os clientes
    }

    // Ao invés de enviar res.json(), agora vamos fazer o redirecionamento diretamente
    res.redirect("/realtimeproducts"); // Redireciona para a página de produtos após esvaziar o carrinho

  } catch (error) {
    console.error("Erro ao esvaziar o carrinho:", error);
    res.status(500).json({ success: false, message: "Erro ao esvaziar o carrinho." });
  }
});

// Rota para diminuir a quantidade de um produto no carrinho
router.post("/decreaseQuantity/:productId", (req, res) => {
  const { productId } = req.params;
  try {
    let cart = readFile(cartPath); // Lê o carrinho atual (sem 'await', pois a função é síncrona)

    const product = cart.find(item => item.id === parseInt(productId)); // Encontra o produto no carrinho
    if (!product) {
      return res.status(404).send("Produto não encontrado no carrinho.");
    }

    if (product.quantity > 1) {
      product.quantity -= 1; // Diminui a quantidade se for maior que 1
    } else {
      cart = cart.filter(item => item.id !== parseInt(productId)); // Remove o produto se a quantidade for 1
    }

    writeFile(cartPath, cart); // Grava o carrinho atualizado (sem 'await', pois a função é síncrona)

    // Emite um evento para todos os clientes notificando que o carrinho foi atualizado
    const io = req.app.io;
    if (io) {
      io.emit("updateCart", cart); // Atualiza o carrinho para todos os clientes
    }

    res.redirect("/cart"); // Redireciona para a página do carrinho para refletir a mudança
  } catch (error) {
    res.status(500).send("Erro ao diminuir quantidade do produto.");
  }
});

// Rota para remover um produto do carrinho
router.post("/removeFromCart/:productId", (req, res) => {
  const { productId } = req.params;
  try {
    let cart = readFile(cartPath); // Lê o carrinho atual (sem 'await', pois a função é síncrona)
    cart = cart.filter(item => item.id !== parseInt(productId)); // Remove o produto com o id fornecido
    writeFile(cartPath, cart); // Grava o carrinho atualizado (sem 'await', pois a função é síncrona)

    // Emite um evento para todos os clientes notificando que o carrinho foi atualizado
    const io = req.app.io;
    if (io) {
      io.emit("updateCart", cart); // Atualiza o carrinho para todos os clientes
    }

    res.redirect("/cart"); // Redireciona para a página do carrinho para refletir a remoção
  } catch (error) {
    res.status(500).send("Erro ao remover produto do carrinho.");
  }
});


module.exports = router;
