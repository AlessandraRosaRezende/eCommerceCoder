require('dotenv').config();
const express = require("express");
const session = require('express-session');
const passport = require('./config/passport.config');
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { engine } = require("express-handlebars");
const handlebars = require('handlebars');
const { connection, PORT, SESSION_SECRET, MONGO_URL } = require("./config/connection");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash'); // Importe o connect-flash
const methodOverride = require('method-override');
const authRouter = require('./routes/auth.router');
const productRouter = require('./routes/product.router');
const userRouter = require('./routes/user.router');
const cartRouter = require('./routes/cart.router');
const orderRouter = require('./routes/order.router');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Criação do servidor WebSocket

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


connection();

// Configuração do Express e Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));

handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});

handlebars.registerHelper('formatPrice', (price) => {
  return price.toFixed(2);
});

handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    ttl: 24 * 60 * 60, // Tempo de vida da sessão em segundos (1 dia)
    autoRemove: 'native'
  })
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  req.app.io = io; // Passa o objeto io para as rotas
  req.session.user = req.user;
  console.log(req.user);
  next();
});

// Usar connect-flash APÓS a configuração da sessão
app.use(flash());

// Middleware para disponibilizar req.user nas views
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.loginMessage = req.flash('loginMessage'); // Para mensagens de login do Passport
  res.locals.forgotMessage = req.flash('forgotMessage'); // Para mensagens de "Esqueci a Senha"
  res.locals.resetMessage = req.flash('resetMessage');   // Para mensagens de redefinição de senha
  next();
});

// Rotas
app.use('/', authRouter); // Rotas de autenticação (login, registro, logout, github)
app.use('/products', productRouter); // Rotas de produtos
app.use('/users', userRouter); // Rotas de usuários
app.use('/cart', cartRouter); // Rotas do carrinho
app.use('/orders', orderRouter); // Rotas de pedidos

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

// Exportar a instância do io para os controllers (para emitir eventos)
app.io = io;

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
