const express = require("express");
const path = require("path");
const { readFile, writeFile } = require("../utils");

const router = express.Router();
const productsPath = path.join(__dirname, "../data/products.json");

router.get("/", (req, res) => {
  const products = readFile(productsPath);
  if (products.length > 0) {
    res.render("products", {
      title: "Lista de Produtos",
      products
    });
  } else {
    res.render("home", {
      title: "Lista de Produtos",
      message: "Não há produtos cadastrados."
    });
  }
});

router.get("/realtimeproducts", (req, res) => {
  const products = readFile(productsPath);
  res.render("products", { title: "Produtos", products });
});

router.get("/products/:id", (req, res) => {
  const products = readFile(productsPath);
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    res.render("productDetails", { title: product.name, product });
  } else {
    res.status(404).send("Produto não encontrado.");
  }
});

router.get("/addproduct", (req, res) => {
  res.render("addProduct", { title: "Adicionar Produto" });
});

router.post("/addproduct", (req, res) => {
  const products = readFile(productsPath);
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: parseFloat(req.body.price),
    description: req.body.description || "",
  };
  products.push(newProduct);
  writeFile(productsPath, products);
  const io = req.app.io; // Obtém o objeto io do app
  if (io) {
    io.emit("addProduct", products); // Atualiza a lista de produtos
  } else {
    console.error("WebSocket (io) não está disponível");
  }
  res.redirect("/realtimeproducts");
});

router.get("/editproduct/:id", (req, res) => {
  const { id } = req.params;
  const products = readFile(productsPath); // Lê os produtos existentes

  const product = products.find((prod) => prod.id === parseInt(id)); // Encontra o produto pelo ID
  if (!product) {
    return res.status(404).send("Produto não encontrado");
  }

  res.render("editProduct", { product }); // Renderiza a página de edição
});

router.post("/editproduct/:id", (req, res) => {
  const products = readFile(productsPath);
  const productIndex = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (productIndex !== -1) {
    products[productIndex] = {
      ...products[productIndex],
      name: req.body.name,
      price: parseFloat(req.body.price),
      description: req.body.description || "",
    };
    writeFile(productsPath, products);
    const io = req.app.io;
    if (io) {
      io.emit("editProduct", products); // Atualiza a lista de produtos em tempo real
    }
    res.redirect("/realtimeproducts");
  } else {
    res.status(404).send("Produto não encontrado.");
  }
});

router.post("/deleteproduct/:id", (req, res) => {
  const products = readFile(productsPath);
  const filteredProducts = products.filter((p) => p.id !== parseInt(req.params.id));
  writeFile(productsPath, filteredProducts);
  const io = req.app.io;
  if (io) {
    io.emit("deleteProduct", products); // Atualiza a lista de produtos em tempo real
  }
  res.redirect("/realtimeproducts");
});

module.exports = router;
