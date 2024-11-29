const express = require("express");
const productModel = require("../models/product.model");
const upload = require('../multer-config'); // Configuração do multer

const router = express.Router();

router.get("/", async (req, res) => {
  try { 
    let products = await productModel.find();
    console.log(products);
    if (products.length > 0) {
      products = products.map((product) => product.toJSON());
      return res.render("products", {
        title: "Lista de Produtos",
        products
      });
    } else {
      return res.render("home", {
        title: "Lista de Produtos",
        message: "Não há produtos cadastrados."
      });
    }
  } catch(err){
    return res.status(500).send("Erro ao buscar produtos.");
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    let products = await productModel.find();
    if (products.length > 0) {
      products = products.map((product) => product.toJSON());
      return res.render("products", {
        title: "Lista de Produtos",
        products
      });
    } else {
      return res.render("home", {
        title: "Lista de Produtos",
        message: "Não há produtos cadastrados."
      });
    }
  } catch (error) {
    return res.status(500).send("Erro ao buscar produtos.");
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    let product = await productModel.findById(req.params.id);
    if (product) {
      product = product.toJSON();
      return res.render("productDetails", { title: product.name, product });
    } else {
      return res.status(404).send("Produto não encontrado.");
    }
  } catch (error) {
    return res.status(500).send("Erro ao buscar produto.");
  }
});

router.get("/addproduct", (req, res) => {
  return res.render("addProduct", { title: "Adicionar Produto" });
});

router.post("/addproduct", upload.single('imagemURL'), async (req, res) => {
  try {
    const imagem = req.file ? `/images/${req.file.filename}` : ''; // Caminho do avatar
    await productModel.create({
      name: req.body.name,
      price: parseFloat(req.body.price),
      description: req.body.description || "",
      imagemURL: imagem,
    });
  
    let products = await productModel.find();
    products = products.map((product) => product.toJSON());
    const io = req.app.io; // Obtém o objeto io do app
    if (io) {
      io.emit("addProduct", products); // Atualiza a lista de produtos
    } else {
      console.error("WebSocket (io) não está disponível");
    }
    return res.redirect("/realtimeproducts");
  } catch (error) {
    return res.status(500).send("Erro ao adicionar produto.");
  }
});

router.get("/editproduct/:id", async (req, res) => {
  console.log(req.params.id);
  try {
    let product = await productModel.findById(req.params.id);
    if (product) {
      product = product.toJSON();
      return res.render("editProduct", { title: "Editar Produto", product });
    } else {
      return res.status(404).send("Produto não encontrado.");
    }
  } catch (error) {
    res.status(500).send("Erro ao buscar produto.");
  } 
});

router.post("/editproduct/:id", upload.single('imagemURL'), async (req, res) => {
  try {
    const products = await productModel.findById(req.params.id);
    const { name, price, description } = req.body;
    const imagem = req.file ? `/images/${req.file.filename}` : ''; // Caminho do avatar
    await productModel.findByIdAndUpdate(req.params.id, {
      name,
      price,
      description,
      imagemURL: imagem
    });
    if (products) {
      const io = req.app.io;
      if (io) {
        io.emit("editProduct", products); // Atualiza a lista de produtos em tempo real
      }
      return res.redirect("/realtimeproducts");
    } else {
      return res.status(404).send("Produto não encontrado.");
    }
  } catch (error) {
    res.status(500).send("Erro ao editar produto.");
  }
});

router.post("/deleteproduct/:id", async (req, res) => {
  try {
    let products = await productModel.findById(req.params.id);
    products = products.toJSON();
    await productModel.deleteOne({_id: req.params.id});
    const io = req.app.io;
    if (io) {
      io.emit("deleteProduct", products); // Atualiza a lista de produtos em tempo real
    }
    return res.redirect("/realtimeproducts");
  } catch (error) {
    res.status(500).send("Erro ao excluir produto.");
  }
});

module.exports = router;
