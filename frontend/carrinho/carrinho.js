// Localização do backend e variáveis globais
let usuarioLogado = localStorage.getItem('usuarioLogado');
const HOST_BACKEND = 'http://localhost:3001';

// Variáveis globais para o cálculo
window.valorFinalCalculado = 0;
window.carrinhoVazio = true;

// =======================================================
// === FUNÇÃO PRINCIPAL: MOSTRAR/RECARREGAR CARRINHO (COM EXCLUSÃO) ===
// =======================================================
async function mostrarCarrinho() {
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  
  try {
    // Busca os dados atualizados dos produtos no backend
    const res = await fetch(`${HOST_BACKEND}/produto`);
    const produtosBackend = await res.json();

    // Mapeia o carrinho salvo no localStorage com os dados do backend
    carrinho = carrinho.map(itemDoCarrinho => {
      const prodAtual = produtosBackend.find(p => p.idproduto === itemDoCarrinho.idproduto);
      
      if (prodAtual) {
          return {
              // Chaves salvas no produto.html (id e quantidade)
              idproduto: itemDoCarrinho.idproduto,
              quantidadeEmEstoque: itemDoCarrinho.quantidadeEmEstoque,
              
              // Chaves do backend (nome e preço)
              nomeproduto: prodAtual.nomeproduto,
              precoUnitario: prodAtual.precounitario || 0 // Assumimos 'precounitario'
          };
      }
      return itemDoCarrinho;
    }).filter(item => item.nomeproduto);
    
    // Salva o carrinho mapeado de volta no localStorage para manter a consistência
    localStorage.setItem('carrinho', JSON.stringify(carrinho));

  } catch (error) {
      console.error("Erro ao buscar produtos da API:", error);
  }

  const lista = document.getElementById('lista-carrinho');
  const totalSpan = document.getElementById('total');
  lista.innerHTML = '';
  let total = 0;
  
  carrinho.forEach(item => {
    const li = document.createElement('li');
    // Adicionamos um estilo para garantir que o botão e o texto fiquem alinhados
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding-right: 8px; width: 100%;'; 

    const nome = item.nomeproduto;
    const preco = item.precoUnitario || 0;
    const quantidade = item.quantidadeEmEstoque; 

    if (nome && preco && quantidade) {
        // Texto do produto
        const textoItem = document.createElement('span');
        textoItem.textContent = `${nome} - Qtd: ${quantidade} - Preço: R$ ${(quantidade * preco).toFixed(2)}`;
        li.appendChild(textoItem);

        // Botão de Excluir
        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Remover';
        // Ação de clique chamando a função
        btnExcluir.onclick = () => excluirItemCarrinho(item.idproduto);
        // Estilo minimalista para o botão de exclusão
        btnExcluir.style.cssText = 'background-color: #dc3545; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 14px; width: auto; min-height: 30px; margin: 0 0 0 10px; flex-shrink: 0;';
        btnExcluir.onmouseover = function() { this.style.backgroundColor = '#c82333'; };
        btnExcluir.onmouseout = function() { this.style.backgroundColor = '#dc3545'; };

        li.appendChild(btnExcluir);
        lista.appendChild(li);
        
        total += quantidade * preco;
    }
  });
  
  totalSpan.textContent = total.toFixed(2);
  window.valorFinalCalculado = total;
  window.carrinhoVazio = (carrinho.length === 0 || total === 0);
  document.getElementById('pagina-carrinho').style.display = 'block';
}

// =======================================================
// === FUNÇÃO: EXCLUIR ITEM DO CARRINHO ===
// =======================================================
function excluirItemCarrinho(idProduto) {
    if (confirm("Tem certeza que deseja remover este item do carrinho?")) {
      let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
      
      // Filtra o carrinho, removendo o item com o idproduto correspondente
      const novoCarrinho = carrinho.filter(item => item.idproduto !== idProduto);
      
      localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
      
      // Recarrega a exibição do carrinho
      mostrarCarrinho();
    }
}

// =======================================================
// === FUNÇÕES DE FLUXO DE PAGAMENTO E FINALIZAÇÃO ===
// =======================================================
function mostrarFormaPagamento() {
  if (window.carrinhoVazio) {
    alert('Escolha algum produto da loja para continuar a compra.');
    return;
  }
  if (localStorage.getItem('usuarioLogado') !== 'true') {
    alert('Você precisa estar logado para finalizar a compra. Por favor, faça login.');
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('forma-pagamento').style.display = 'block';
  document.getElementById('btn-finalizar-compra').style.display = 'none';
}

function pagarComCartao() {
    document.getElementById('pagamento-cartao').style.display = 'block';
    document.getElementById('pagamento-pix').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'none';
}

function pagarPIX() {
    document.getElementById('pagamento-pix').style.display = 'block';
    document.getElementById('pagamento-cartao').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'block';
    pagarComPix();
}

function pagarComPix() {
    document.getElementById('pagamento-pix').style.display = 'block';
    document.getElementById('pagamento-cartao').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'block';
    gerarQRCodePix(window.valorFinalCalculado ? window.valorFinalCalculado.toFixed(2) : '0.00');
}


function gerarQRCodePix(valor) {
  const chavePix = '02964990999';
  const nome = 'Celso Mainko';
  const cidade = 'SAO PAULO';
  const descricao = 'Pagamento NailPolish';
  
  function format(id, value) {
    const length = value.length.toString().padStart(2, '0');
    return id + length + value;
  }
  
  let payload = format('00', '01') +
                format('26', format('00', 'BR.GOV.BCB.PIX') + format('01', chavePix) + format('02', descricao)) +
                format('52', '0000') +
                format('53', '986') +
                format('54', valor) +
                format('58', 'BR') +
                format('59', nome) +
                format('60', cidade) +
                format('62', format('05', '***')) +
                '6304';
                
  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  const payloadFinal = payload + crc16(payload);
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  document.getElementById('qrcode-area').style.display = 'block';
  // Note: QRCode is available because the script is linked in HTML
  new QRCode(qrDiv, payloadFinal);
}

function finalizarCompraCartao() {
  const numeroCartao = document.getElementById('numero-cartao').value.trim();
  if (!numeroCartao || numeroCartao.replace(/\s/g, '').length < 16) {
    alert('Digite o número completo do cartão para finalizar a compra.');
    return;
  }
  concluirCompra(); 
}

function finalizarCompraPix() {
    // Aqui você pode adicionar uma verificação se o pagamento PIX foi realmente efetuado,
    // mas na simulação, apenas chamamos concluirCompra.
    concluirCompra();
}

// ATENÇÃO: Esta é a versão FINAL de concluirCompra() que DEVERIA CHAMAR O BACKEND!
function concluirCompra() {
  // *** PONTO CRÍTICO: Chamada real ao Backend para registrar o pedido
  // Ex: await enviarPedidoParaBackend(carrinho, tipoPagamento, total);
  
  // Simulação: Limpa o carrinho
  localStorage.removeItem('carrinho');
  
  // Exibe a mensagem de sucesso
  document.getElementById('pagina-carrinho').style.display = 'none';
  document.getElementById('mensagem-final').style.display = 'block';
  var header = document.getElementById('header-carrinho');
  if (header) header.style.display = 'none';
  
  // Redireciona para o menu após 2 segundos
  setTimeout(function() {
    window.location.href = 'menu.html';
  }, 2000);
}

// Inicialização da página (oculta as formas de pagamento)
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('forma-pagamento').style.display = 'none';
  document.getElementById('pagamento-cartao').style.display = 'none';
  document.getElementById('pagamento-pix').style.display = 'none';
  document.getElementById('qrcode-area').style.display = 'none';
  const btnFinalizar = document.getElementById('btn-finalizar-compra');
  if (btnFinalizar) btnFinalizar.style.display = 'block';
});

function formatarCartao(input) {
  let value = input.value.replace(/\D/g, ''); // Remove tudo que não for dígito
  value = value.substring(0, 16); // Limita a 16 dígitos
  value = value.replace(/(\d{4})(?=\d)/g, '$1 '); // Adiciona espaço a cada 4 dígitos
  input.value = value;
}