// REMOVIDO: const HOST_BACKEND = ... (Já está no context-helper.js)

// =======================================================
// === FUNÇÕES AUXILIARES ===
// =======================================================

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

// =======================================================
// === LÓGICA DE NAVEGAÇÃO E PRODUTOS ===
// =======================================================

/**
 * Troca as abas e carrega produtos se necessário
 */
function trocarAba(abaDestino) {
  console.log('Trocando para aba:', abaDestino);

  // 1. Esconde todos os conteúdos
  document.querySelectorAll('.aba-conteudo').forEach(el => {
    el.classList.remove('aba-ativa-conteudo');
  });

  // 2. Remove destaque de todos os botões
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.remove('aba-ativa');
  });

  // 3. Mostra o conteúdo certo
  const divDestino = document.getElementById(abaDestino);
  if (divDestino) {
    divDestino.classList.add('aba-ativa-conteudo');
  }

  // 4. Destaca o botão certo
  const btnId = abaDestino === 'gerenciamento' ? 'btn-gerenciamento' : 'btn-produtos';
  const btnDestino = document.getElementById(btnId);
  if (btnDestino) {
    btnDestino.classList.add('aba-ativa');
  }

  // 5. Se for produtos, carrega a lista
  if (abaDestino === 'produtos') {
    carregarProdutos();
  }
}

/**
 * Busca produtos no backend
 */
async function carregarProdutos() {
  const lista = document.getElementById('produtos-lista');
  if (!lista) return;

  try {
    lista.innerHTML = '<p>Buscando produtos...</p>';
    
    // O HOST_BACKEND vem do context-helper.js
    const response = await fetch(`${HOST_BACKEND}/produto`); 
    if (!response.ok) throw new Error('Falha ao buscar produtos');
    
    const produtos = await response.json();
    
    if (!Array.isArray(produtos) || produtos.length === 0) {
      lista.innerHTML = '<p>Nenhum produto encontrado.</p>';
      return;
    }

    lista.innerHTML = ''; // Limpa msg de carregando

    produtos.forEach(prod => {
      const article = document.createElement('article');
      article.className = 'produto';

      let oSrc = prod.imagemproduto ? `../${prod.imagemproduto}` : '../imgs/placeholder.png';
      const precoVal = getField(prod, ['precoUnitario', 'precounitario', 'preco', 'price']);
      const nome = getField(prod, ['nomeProduto', 'nomeproduto', 'nome']) || 'Produto';
      const id = getField(prod, ['idProduto', 'idproduto', 'id']);

      // Nota: onclick aqui precisa chamar uma função global ou window
      article.innerHTML = `
        <img src="${oSrc}" alt="${nome}">
        <p class="nome-prod">${nome}</p>
        <p class="preco-prod">${formatPrice(precoVal)}</p>
        <button onclick="window.irParaProduto(${id})">Ver mais</button>
      `;
      lista.appendChild(article);
    });

  } catch (error) {
    console.error(error);
    lista.innerHTML = '<p style="color:red">Erro ao conectar com o servidor.</p>';
  }
}

/**
 * Redireciona para detalhes (precisa estar no window pois é chamado via string HTML)
 */
window.irParaProduto = function(id) {
  if(!id) return;
  // Ajuste o caminho conforme necessário
  window.location.href = `../produto/produto.html?id=${id}`;
};

/**
 * Faz Logout
 */
function logout() {
  localStorage.clear();
  window.location.href = '../menu.html';
}
window.logout = logout; // Expondo globalmente para usar no HTML se precisar

/**
 * Botão Ver Carrinho
 */
function irParaCarrinho() {
    // Se tiver a função global definida em outro arquivo, usa ela, senão redireciona
    window.location.href = '../carrinho/carrinho.html'; 
}
window.irParaCarrinho = irParaCarrinho;


// =======================================================
// === INICIALIZAÇÃO (Quando a página carrega) ===
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Carregado - Iniciando Menu Gerente");

  // 1. Verificação de Segurança
  const ehGerente = localStorage.getItem('ehGerente');
  const usuarioLogado = localStorage.getItem('usuarioLogado');

  if (usuarioLogado !== 'true' || ehGerente !== 'true') {
    alert("Acesso negado. Redirecionando...");
    window.location.href = '../menu.html';
    return;
  }

  // 2. Configurar os botões das ABAS (Event Listeners)
  const btnGerente = document.getElementById('btn-gerenciamento');
  const btnProdutos = document.getElementById('btn-produtos');

  if (btnGerente) {
    btnGerente.addEventListener('click', () => trocarAba('gerenciamento'));
  }
  if (btnProdutos) {
    btnProdutos.addEventListener('click', () => trocarAba('produtos'));
  }

  // 3. Configurar botões do topo
  const btnLogout = document.getElementById('btn-logout-top');
  if (btnLogout) {
      btnLogout.addEventListener('click', logout);
  }
  const btnCarrinho = document.getElementById('btn-carrinho');
  if (btnCarrinho) {
      btnCarrinho.addEventListener('click', irParaCarrinho);
  }

  // 4. Gerenciar ícone de login/perfil
  gerenciarEstadoLogin();
});

function gerenciarEstadoLogin() {
  const ehGerente = localStorage.getItem('ehGerente');
  const userArea = document.getElementById('user-area');
  
  // Cria ícone visual
  const perfilIcon = document.createElement('div');
  perfilIcon.className = 'perfil-icon';
  perfilIcon.textContent = ehGerente === 'true' ? '👑' : '👤';
  perfilIcon.style.cssText = 'width: 40px; height: 40px; background: #FFD700; border-radius: 50%; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:10px; font-size:20px; border: 2px solid #8B1E3F;';
  
  if(userArea) userArea.appendChild(perfilIcon);
}