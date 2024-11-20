const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { engine } = require("express-handlebars");
const productsRouter = require("./routes/productRoutes");
const cartsRouter = require("./routes/cartRoutes");
const handlebars = require('handlebars');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Criação do servidor WebSocket

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8080;

// Configuração do Express e Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));

handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});

app.use((req, res, next) => {
  req.app.io = io; // Passa o objeto io para as rotas
  next();
});

// Rotas
app.use(productsRouter);
app.use(cartsRouter);

// WebSocket
io.on("connection", (socket) => {
  console.log("Novo cliente conectado!");

  // Evento para adicionar produto
  socket.on("addProduct", (productData) => {
    console.log("Produto adicionado:", productData);
    io.emit("refreshProducts", productData); // Atualiza a lista de produtos para todos os clientes
  });

  // Evento para editar produto
  socket.on("editProduct", (updatedProduct) => {
    console.log("Produto editado:", updatedProduct);
    io.emit("refreshProducts", updatedProduct); // Atualiza a lista de produtos para todos os clientes
  });

  // Evento para deletar produto
  socket.on("deleteProduct", (productId) => {
    console.log("Produto deletado:", productId);
    io.emit("refreshProducts", { productId, deleted: true }); // Remove o produto para todos os clientes
  });

  // Evento para atualizar carrinho
  socket.on("updateCart", (cartData) => {
    console.log("Carrinho atualizado:", cartData);
    io.emit("refreshCart", cartData); // Atualiza o carrinho para todos os clientes
  });

  // Evento para esvaziar carrinho
  socket.on("clearCart", () => {
    console.log("Carrinho esvaziado");
    io.emit("refreshCart", []); // Envia um carrinho vazio para todos os clientes
  });

  // Cliente desconectado
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});


// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
