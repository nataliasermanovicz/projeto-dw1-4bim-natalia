/**
 * Helper de Contexto - Gerencia redirecionamentos baseado no perfil do usuário
 * Usado por cliente e gerente para manter a navegação no contexto apropriado
 */

const HOST_BACKEND = 'http://localhost:3001';

/**
 * Verifica se o usuário é gerente
 * @returns {boolean}
 */
function ehGerente() {
  return localStorage.getItem('ehGerente') === 'true';
}

/**
 * Redireciona para a página de menu apropriada
 */
function irParaMenu() {
  if (ehGerente()) {
    window.location.href = `${HOST_BACKEND}/frontend-Gerente/menu.html`;
  } else {
    window.location.href = `${HOST_BACKEND}/menu`;
  }
}

/**
 * Redireciona para a página de produto apropriada
 * @param {number} produtoId - ID do produto
 */
function irParaProduto(produtoId) {
  if (ehGerente()) {
    window.location.href = `${HOST_BACKEND}/frontend-Gerente/produto.html?id=${produtoId}`;
  } else {
    window.location.href = `${HOST_BACKEND}/frontend/produto/produto.html?id=${produtoId}`;
  }
}

/**
 * Redireciona para o carrinho apropriado
 */
function irParaCarrinho() {
  if (ehGerente()) {
    window.location.href = `${HOST_BACKEND}/frontend-Gerente/carrinho.html`;
  } else {
    window.location.href = `${HOST_BACKEND}/frontend/carrinho/carrinho.html`;
  }
}

/**
 * Redireciona para o histórico de pedidos apropriado
 */
function irParaPedidos() {
  if (ehGerente()) {
    window.location.href = `${HOST_BACKEND}/frontend-Gerente/registroPedidos.html`;
  } else {
    window.location.href = `${HOST_BACKEND}/frontend/carrinho/registroPedidos.html`;
  }
}

// Expõe funções globalmente
window.ehGerente = ehGerente;
window.irParaMenu = irParaMenu;
window.irParaProduto = irParaProduto;
window.irParaCarrinho = irParaCarrinho;
window.irParaPedidos = irParaPedidos;
