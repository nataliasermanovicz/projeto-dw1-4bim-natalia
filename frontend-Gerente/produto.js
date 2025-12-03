// Variável global para armazenar os dados do produto carregado
let produtoSelecionado = null;
const HOST_BACKEND = 'http://localhost:3001'; // Define a URL do Backend

/**
 * Função assíncrona para carregar os dados do produto a partir do backend.
 */
async function carregarProdutoBackend() {
  // Captura o parâmetro 'id' da URL (ex: ?id=5)
  const urlParams = new URLSearchParams(window.location.search);
  const idProduto = parseInt(urlParams.get('id'));

  if (!isNaN(idProduto)) {
    try {
      // Faz a requisição para buscar a lista de todos os produtos
      const res = await fetch(`${HOST_BACKEND}/produto`);
      const produtos = await res.json();

      // Localiza o produto pelo 'idproduto'
      produtoSelecionado = produtos.find(prod => prod.idproduto === idProduto);

      if (produtoSelecionado) {
        // Atualiza os elementos HTML com os dados do produto
        document.getElementById('nomeProduto').textContent = produtoSelecionado.nomeproduto;
        // Assume o caminho da imagem relativo ao servidor
        document.getElementById('imagemProduto').src = `../../${produtoSelecionado.imagemproduto}`;
        
        // Adiciona a chave precounitario ao objeto selecionado para uso no carrinho
        // Se o seu backend não retorna o preço na busca de todos os produtos, ajuste aqui
        produtoSelecionado.precounitario = produtoSelecionado.precounitario || 0;
        
        // Exibe o preço formatado em BRL
        const preco = parseFloat(produtoSelecionado.precounitario || 0);
        document.getElementById('precoProduto').textContent = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 

      } else {
        alert('Produto não encontrado.');
        document.getElementById('nomeProduto').textContent = 'Produto Não Encontrado';
      }
    } catch (error) {
      console.error('Erro ao carregar o produto:', error);
      alert('Erro ao carregar o produto.');
    }
  } else {
    document.getElementById('nomeProduto').textContent = 'ID do Produto Inválido';
    alert('ID do produto inválido.');
  }
}

/**
 * Função para adicionar o produto e a quantidade selecionada ao localStorage (carrinho).
 */
function adicionarCarrinho() {
  if (!produtoSelecionado) {
    alert("Nenhum produto está carregado. Não é possível adicionar ao carrinho.");
    return;
  }
  
  const quantidadeEmEstoque = parseInt(document.getElementById('quantidadeEmEstoque').value);
  
  if (!quantidadeEmEstoque || quantidadeEmEstoque <= 0) {
    alert('Por favor, selecione uma quantidade válida (mínimo 1).');
    return;
  }

  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  
  // Verifica se o item já existe no carrinho
  const itemExistente = carrinho.find(item => item.idproduto === produtoSelecionado.idproduto);

  if (itemExistente) {
    // Se existir, aumenta a quantidade
    itemExistente.quantidadeEmEstoque += quantidadeEmEstoque;
  } else {
    // Se não existir, adiciona o novo item com os dados do produto e a quantidade
    carrinho.push({ 
        // Campos essenciais para o carrinho
        idproduto: produtoSelecionado.idproduto, 
        quantidadeEmEstoque: quantidadeEmEstoque,
        
        // Incluindo campos extras para renderização rápida no carrinho (opcional)
        nomeproduto: produtoSelecionado.nomeproduto, 
        precounitario: produtoSelecionado.precounitario
    });
  }

  // Salva o carrinho atualizado
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  alert('Produto adicionado ao carrinho!');
}

// =======================================================
// === INICIALIZAÇÃO ===
// =======================================================

// Carrega o produto assim que a página estiver pronta
window.addEventListener('DOMContentLoaded', carregarProdutoBackend);

// Expõe a função para que o botão no HTML possa chamá-la
window.adicionarCarrinho = adicionarCarrinho;
