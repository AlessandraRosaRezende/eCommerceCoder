// public/js/index.js
const socket = io();

console.log("Index.js carregado");

socket.on("connect", () => {
  console.log("Conectado ao servidor WebSocket!");
});

// Atualiza automaticamente a lista de produtos sempre que algo muda no servidor
socket.on("refreshProducts", (data) => {
  alert("Produto atualizados com sucesso");
  location.reload(); // Recarrega a página para refletir as alterações
});

// Atualiza a lista de produtos ao esvaziar o carrinho
socket.on("clearCart", () => {
  alert("Carrinho esvaziado!");
  location.reload(); // Recarga a página para mostrar os produtos novamente
});

// Função para limpar o carrinho
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado");

  // Botão para esvaziar carrinho
  const clearCartButton = document.getElementById("clear-cart");
  if (clearCartButton) {
    clearCartButton.addEventListener("click", async () => {
      console.log("Botão de esvaziar carrinho clicado");

      const response = await fetch("/clearcart", {
        method: "POST",
      });

      if (response.ok) {
        alert("Carrinho esvaziado!");
        window.location.href = "/realtimeproducts";  // Redireciona para a página de produtos
      } else {
        alert("Erro ao esvaziar o carrinho.");
      }
    });
  } else {
    console.log("Botão de esvaziar carrinho não encontrado");
  }
});

