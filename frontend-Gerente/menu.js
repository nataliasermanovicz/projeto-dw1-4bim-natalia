// A URL do seu backend
const HOST_BACKEND = 'http://localhost:3001';

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

/**
 * Função para gerenciar abas (Gerenciamento vs Produtos)
 */
function abrirAba(novaAba, btnEl) {
  console.log('[menu-gerente] abrirAba chamado:', novaAba, btnEl);
  // Ocultar todas as abas
  const abas = document.querySelectorAll('.aba-conteudo');
  abas.forEach(aba => aba.classList.remove('aba-ativa-conteudo'));

  // Remover classe ativa dos botões
  const btns = document.querySelectorAll('.aba-btn');
  btns.forEach(btn => btn.classList.remove('aba-ativa'));

  // Mostrar aba selecionada
  const abaEscolhida = document.getElementById(novaAba);
  if (abaEscolhida) {
    abaEscolhida.classList.add('aba-ativa-conteudo');
  }

  // Marcar botão como ativo
  try {
    if (btnEl && btnEl.classList) {
      btnEl.classList.add('aba-ativa');
    } else {
      // fallback: marca primeiro botão que corresponde ao nome da aba
      const fallback = Array.from(document.querySelectorAll('.aba-btn')).find(b => b.textContent.toLowerCase().includes(novaAba));
      if (fallback) fallback.classList.add('aba-ativa');
    }
  } catch (e) {
    console.warn('Não foi possível marcar botão ativo', e);
  }

  // Se for aba de produtos, carregar produtos
  if (novaAba === 'produtos') {
    carregarProdutos();
  }
}

/**
 * Função assíncrona para carregar a lista de produtos da API e renderizar na tela.
 */
async function carregarProdutos() {
  try {
    const response = await fetch(`${HOST_BACKEND}/produto`); 
    if (!response.ok) {
      throw new Error('Erro ao carregar produtos');
    }
    const produtos = await response.json();
    console.log('[menu-gerente] carregarProdutos: produtos recebidos, quantidade=', Array.isArray(produtos) ? produtos.length : 0);
    const lista = document.getElementById('produtos-lista');

    if (!lista) {
      console.warn('[menu-gerente] carregarProdutos: elemento #produtos-lista não encontrado no DOM');
      return;
    }

    // Limpa a lista antes de adicionar os novos produtos
    lista.innerHTML = '';

    (Array.isArray(produtos) ? produtos : []).forEach(prod => {
      const article = document.createElement('article');
      article.className = 'produto';

      // Caminho da imagem
      let oSrc = prod && prod.imagemproduto ? `../${prod.imagemproduto}` : '../imgs/placeholder.png';

      // Preço: tenta várias chaves possíveis
      const precoVal = getField(prod, ['precoUnitario', 'precounitario', 'preco', 'price']) || 0;
      const precoStr = formatPrice(precoVal);

      const nome = getField(prod, ['nomeProduto', 'nomeproduto', 'nome']) || 'Produto';
      const id = getField(prod, ['idProduto', 'idproduto', 'id']) || '';

      article.innerHTML = `
        <img src="${oSrc}" alt="${nome}">
        <p class="nome-prod">${nome}</p>
        <p class="preco-prod">${precoStr}</p>
        <button onclick="irParaProduto(${id})">Ver mais</button>
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
 * Função que gerencia o ícone de Perfil vs. Botão de Login para GERENTES.
 */
function gerenciarEstadoLogin() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const ehGerente = localStorage.getItem('ehGerente');
  const userArea = document.getElementById('user-area');
  const loginButton = document.getElementById('loginButton');

  // Se não está logado, mostrar apenas botão de login
  if (usuarioLogado !== 'true') {
    return;
  }

  // Remover botão de login (se existir)
  if (loginButton) loginButton.remove();

  // Criar botão de Pedidos
  const pedidosButton = document.createElement('button');
  pedidosButton.id = 'pedidosButton';
  pedidosButton.textContent = 'Meus Pedidos';
  pedidosButton.style.backgroundColor = '#FFD700';
  pedidosButton.style.color = '#333';
  pedidosButton.style.border = 'none';
  pedidosButton.style.padding = '12px 20px';
  pedidosButton.style.borderRadius = '6px';
  pedidosButton.style.cursor = 'pointer';
  pedidosButton.onclick = function () {
    if (typeof irParaPedidos === 'function') {
      irParaPedidos();
    } else {
      window.location.href = '../frontend/carrinho/registroPedidos.html';
    }
  };
  userArea.appendChild(pedidosButton);

  // Cria o ícone de perfil adequado
  const perfilIcon = document.createElement('div');
  perfilIcon.className = 'perfil-icon';
  if (ehGerente === 'true') {
    perfilIcon.textContent = '👑';
    perfilIcon.title = 'Perfil (Gerente)';
    perfilIcon.style.cssText = 'position: relative; cursor: pointer; width: 45px; height: 45px; border-radius: 50%; background-color: #FFD700; display: inline-flex; align-items: center; justify-content: center; color: #8B1E3F; font-weight: bold; font-size: 24px; margin-left: 10px; border: 2px solid #8B1E3F;';
  } else {
    perfilIcon.textContent = '👤';
    perfilIcon.title = 'Perfil';
    perfilIcon.style.cssText = 'position: relative; cursor: pointer; width: 45px; height: 45px; border-radius: 50%; background-color: #8B1E3F; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 18px; margin-left: 10px; border: 2px solid #6e1530;';
  }

  // Criar o Menu dropdown de Perfil
  const menuPerfil = document.createElement('div');
  menuPerfil.style.cssText = 'display: none; position: absolute; top: 50px; right: 0; background-color: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 1000; min-width: 140px;';
  menuPerfil.innerHTML = `
    <button style="background: none; border: none; color: #333; padding: 12px; cursor: pointer; width: 100%; text-align: left; font-size: 14px; font-weight: 500;" onclick="logout()">Sair</button>
  `;

  perfilIcon.appendChild(menuPerfil);

  perfilIcon.onclick = function (e) {
    e.stopPropagation();
    menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none';
  };

  document.addEventListener('click', function (e) {
    if (!perfilIcon.contains(e.target)) {
      menuPerfil.style.display = 'none';
    }
  });

  if (userArea) {
    userArea.appendChild(perfilIcon);
  }
}

/**
 * Função de logout: Limpa os dados do usuário e redireciona para o menu principal.
 */
function logout() {
  console.log("Logout acionado");
  // Limpar dados do usuário armazenados no localStorage
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem('perfilUsuario');
  localStorage.removeItem('usuarioEmail');
  localStorage.removeItem('clienteIdPessoa');
  localStorage.removeItem('ehGerente');

  // Redirecionar para o menu principal
  window.location.href = `${HOST_BACKEND}/menu`;
}

// =======================================================
// === INICIALIZAÇÃO DA PÁGINA ===
// =======================================================

// Quando o DOM estiver totalmente carregado:
window.addEventListener('DOMContentLoaded', () => {
  // Verifica se o usuário é gerente; caso contrário, redireciona
  const ehGerente = localStorage.getItem('ehGerente');
  const usuarioLogado = localStorage.getItem('usuarioLogado');

  if (usuarioLogado !== 'true' || ehGerente !== 'true') {
    // CORRIGIDO: Redireciona para o HTML correto caso tente acessar sem permissão
    // (Anteriormente estava apontando para o Backend)
    window.location.href = '../frontend/menu.html';
    return;
  }

  gerenciarEstadoLogin(); 

  // Lógica do ícone de gerente fixo no HTML (se existir)
  const gerenteIcon = document.getElementById('gerente-icon');
  const gerenteDropdown = document.getElementById('gerente-dropdown');
  if (gerenteIcon && gerenteDropdown) {
    gerenteIcon.onclick = function(e) {
      e.stopPropagation();
      gerenteDropdown.style.display = gerenteDropdown.style.display === 'none' ? 'block' : 'none';
    };
    
    gerenteDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    document.addEventListener('click', function(e) {
      if (!gerenteIcon.contains(e.target) && !gerenteDropdown.contains(e.target)) {
        gerenteDropdown.style.display = 'none';
      }
    });
  }
});

// Expõe as funções globalmente
window.logout = logout;
window.abrirAba = abrirAba;