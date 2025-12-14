// Variável global para armazenar os dados do produto carregado
let produtoSelecionado = null;

// REMOVIDO: const HOST_BACKEND... (Já existe no context-helper.js)
// Se o context-helper falhar, usamos um fallback seguro, mas não redeclaramos com const
const API_URL = (typeof HOST_BACKEND !== 'undefined') ? HOST_BACKEND : 'http://localhost:3001';

// =======================================================
// === FUNÇÃO DE BUSCA DO PRODUTO ===
// =======================================================
async function carregarProdutoBackend() {
  const urlParams = new URLSearchParams(window.location.search);
  const idProduto = parseInt(urlParams.get('id'));

  if (!idProduto || isNaN(idProduto)) {
    alert('ID do produto inválido.');
    document.getElementById('nomeProduto').textContent = 'Produto não especificado';
    return;
  }

  try {
    // Busca direta pelo ID
    const res = await fetch(`${API_URL}/produto/${idProduto}`);
    
    if (!res.ok) {
        throw new Error("Produto não encontrado no servidor.");
    }

    const produto = await res.json();
    produtoSelecionado = produto;

    // --- TRATAMENTO DE CHAVES (ALIASES) ---
    const nome = produto.nome_produto || produto.nomeproduto || 'Sem Nome';
    const preco = parseFloat(produto.preco_unitario || produto.precounitario || 0);
    const imagem = produto.imagem_produto || produto.imagemproduto || produto.imagemProduto;

    // --- ATUALIZAÇÃO DO DOM ---
    document.getElementById('nomeProduto').textContent = nome;
    
    // Formatação do Preço
    document.getElementById('precoProduto').textContent = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Correção do Caminho da Imagem
    // HTML em: /frontend-Gerente/produtoGerente/
    // Imagem em: /imgs/ (Raiz) -> Sobe 2 níveis
    const caminhoImagem = imagem ? `../../${imagem}` : '../../imgs/placeholder.png';
    document.getElementById('imagemProduto').src = caminhoImagem;

  } catch (error) {
    console.error('Erro ao carregar o produto:', error);
    document.getElementById('nomeProduto').textContent = 'Erro ao carregar';
  }
}

// =======================================================
// === FUNÇÃO DE CARRINHO ===
// =======================================================
function adicionarCarrinho() {
  if (!produtoSelecionado) {
    alert("Aguarde o carregamento do produto.");
    return;
  }
  
  const qtdInput = document.getElementById('quantidadeEmEstoque');
  const quantidade = parseInt(qtdInput.value);
  
  if (!quantidade || quantidade <= 0) {
    alert('Selecione uma quantidade válida (mínimo 1).');
    return;
  }

  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  
  // Normaliza IDs
  const idAtual = produtoSelecionado.id_produto || produtoSelecionado.idproduto;
  
  const itemExistente = carrinho.find(item => {
      const itemId = item.idproduto || item.idProduto;
      return String(itemId) === String(idAtual);
  });

  if (itemExistente) {
    if(itemExistente.quantidadeEmEstoque) itemExistente.quantidadeEmEstoque += quantidade;
    else itemExistente.quantidade += quantidade;
  } else {
    carrinho.push({ 
        idproduto: idAtual, 
        quantidadeEmEstoque: quantidade,
        nomeproduto: produtoSelecionado.nome_produto || produtoSelecionado.nomeproduto, 
        precoUnitario: parseFloat(produtoSelecionado.preco_unitario || produtoSelecionado.precounitario)
    });
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  alert('Produto adicionado ao carrinho!');
}

// =======================================================
// === INICIALIZAÇÃO ===
// =======================================================

window.addEventListener('DOMContentLoaded', carregarProdutoBackend);

// Expõe a função para que o botão no HTML possa chamá-la
window.adicionarCarrinho = adicionarCarrinho;

// OBS: As funções irParaMenu e irParaCarrinho NÃO são redefinidas aqui
// porque elas já são carregadas pelo context-helper.js no HTML.