// A URL do seu backend
const HOST_BACKEND = 'http://localhost:3001';

/**
 * Função assíncrona para carregar a lista de produtos da API e renderizar na tela.
 */
// Helper: busca campo com variações de nome
function getField(obj, fields) {
  for (const f of fields) {
    if (obj[f] !== undefined) return obj[f];
  }
  return undefined;
}

function formatPrice(value) {
  const v = Number(value || 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function carregarProdutos() {
  try {
    const res = await fetch(`${HOST_BACKEND}/produto`);
    const produtos = await res.json();
    const lista = document.getElementById('produtos-lista');
    
    // Limpa a lista antes de adicionar os novos produtos
    lista.innerHTML = '';
    
    produtos.forEach(prod => {
      const article = document.createElement('article');
      article.className = 'produto';

      // Caminho da imagem: ajustado para usar a variável do backend
      let oSrc = `../${prod.imagemproduto}`; // Assumindo que a imagem está 2 níveis acima do menu.html

      // Preço: tenta várias chaves possíveis que seu backend pode retornar
      const precoVal = getField(prod, ['precoUnitario', 'precounitario', 'preco', 'price']) || 0;
      const precoStr = formatPrice(precoVal);

      const nome = getField(prod, ['nomeProduto', 'nomeproduto', 'nome']) || 'Produto';
      const id = getField(prod, ['idProduto', 'idproduto', 'id']) || '';

      article.innerHTML = `
        <img src="${oSrc}" alt="${nome}">
        <p class="nome-prod">${nome}</p>
        <p class="preco-prod">${precoStr}</p>
        <button onclick="window.location.href='../produto/produto.html?id=${id}'">Ver mais</button>
      `;
      lista.appendChild(article);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    const lista = document.getElementById('produtos-lista');
    if (lista) lista.innerHTML = '<p>Não foi possível carregar os produtos. Verifique a conexão com o backend.</p>';
  }
}

/**
 * Função de logout: Limpa o localStorage e redireciona.
 * Se você tiver uma rota de logout no backend, ela deve ser chamada aqui.
 */
function logout() {
  // Limpar todos os itens relevantes
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem('perfilUsuario');
  localStorage.removeItem('usuarioEmail');
  localStorage.removeItem('clienteIdPessoa'); // Limpar ID do cliente
  
  // Redireciona para a rota de menu do backend
  window.location.href = `${HOST_BACKEND}/menu`;
}

/**
 * Função que gerencia o ícone de Perfil vs. Botão de Login.
 */
function gerenciarEstadoLogin() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const userArea = document.getElementById('user-area');
  const loginButton = document.getElementById('loginButton');

  if (usuarioLogado === 'true' && userArea) {
    // 1. Remove o botão de Login
    if (loginButton) loginButton.remove();

    // 2. Cria o botão 'Pedidos' que redireciona para a página de registros de pedidos
    const pedidosButton = document.createElement('button');
    pedidosButton.id = 'pedidosButton';
    pedidosButton.textContent = 'Pedidos';
    pedidosButton.style.backgroundColor = '#8B1E3F';
    pedidosButton.style.color = '#fff';
    pedidosButton.style.border = 'none';
    pedidosButton.style.padding = '12px 20px';
    pedidosButton.style.borderRadius = '6px';
    pedidosButton.style.cursor = 'pointer';
    pedidosButton.onclick = function () {
      window.location.href = '../carrinho/registroPedidos.html';
    };
    // Insere o botão antes do ícone de perfil (será adicionado abaixo)
    userArea.appendChild(pedidosButton);

    // 2. Cria o ícone de Perfil (👤)
    const perfilIcon = document.createElement('div');
    perfilIcon.className = 'perfil-icon';
    perfilIcon.textContent = '👤';
    perfilIcon.title = 'Perfil';
    // Adiciona estilos inline para posicionamento e visual
    perfilIcon.style.cssText = 'position: relative; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; background-color: #8B1E3F; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;';
    
    // 3. Cria o Menu dropdown de Perfil
    const menuPerfil = document.createElement('div');
    // Adiciona estilos inline do código original
    menuPerfil.style.cssText = 'display: none; position: absolute; top: 45px; right: 0; background-color: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 120px;';
    menuPerfil.innerHTML = `<button style="background:none; border:none; color:#8B1E3F; padding:10px; cursor:pointer; width:100%; text-align: left; font-size: 16px;" onclick="logout()">Sair</button>`;
    
    perfilIcon.appendChild(menuPerfil);

    // 4. Lógica para mostrar/esconder o menu ao clicar no ícone
    perfilIcon.onclick = function (e) {
      e.stopPropagation(); // Evita que o clique se propague para o document
      menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none';
    };

    // 5. Esconder o menu se clicar em qualquer lugar fora dele
    document.addEventListener('click', function (e) {
      if (!perfilIcon.contains(e.target)) {
        menuPerfil.style.display = 'none';
      }
    });

    userArea.appendChild(perfilIcon);
  }
}

// =======================================================
// === INICIALIZAÇÃO DA PÁGINA ===
// =======================================================

// Quando o DOM estiver totalmente carregado:
window.addEventListener('DOMContentLoaded', () => {
  carregarProdutos(); // Carrega os produtos
  gerenciarEstadoLogin(); // Verifica e atualiza o estado de Login/Perfil
});

// Expõe a função de logout globalmente para que o HTML possa chamá-la
window.logout = logout;