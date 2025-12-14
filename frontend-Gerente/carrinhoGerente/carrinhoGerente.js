// Localização do backend e variáveis globais
let usuarioLogado = localStorage.getItem('usuarioLogado');
const HOST_BACKEND = 'http://localhost:3001';

// Variáveis globais para o cálculo
window.valorFinalCalculado = 0;
window.carrinhoVazio = true;

// Variável para controlar a forma de pagamento (1=Cartão, 2=PIX) - Default PIX
let idFormaPagamentoSelecionada = 2; 

// =======================================================
// === FUNÇÃO PRINCIPAL: MOSTRAR/RECARREGAR CARRINHO ===
// =======================================================
async function mostrarCarrinho() {
    let carrinhoRaw = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Normaliza itens do carrinho aceitando chaves variadas
    function normalizeItem(item) {
        if (!item) return null;
        const id = item.idproduto || item.idProduto || item.id || item.produtoidproduto || null;
        const quantidade = item.quantidadeEmEstoque || item.quantidade || item.qtd || item.amount || 0;
        const nome = item.nomeproduto || item.nomeProduto || item.nome || item.descricao || '';
        const preco = item.precoUnitario || item.precounitario || item.preco || item.price || 0;
        return { idproduto: id, quantidadeEmEstoque: quantidade, nomeproduto: nome, precoUnitario: preco };
    }

    let carrinho = carrinhoRaw.map(normalizeItem).filter(i => i && i.idproduto !== undefined && i.idproduto !== null);

    try {
        const res = await fetch(`${HOST_BACKEND}/produto`);
        const produtosBackend = await res.json();

        carrinho = carrinho.map(itemDoCarrinho => {
            const prodAtual = produtosBackend.find(p => {
                const pid = p.idproduto || p.idProduto || p.id;
                return String(pid) === String(itemDoCarrinho.idproduto);
            });

            if (prodAtual) {
                return {
                    idproduto: itemDoCarrinho.idproduto,
                    quantidadeEmEstoque: itemDoCarrinho.quantidadeEmEstoque,
                    nomeproduto: prodAtual.nomeproduto || itemDoCarrinho.nomeproduto,
                    precoUnitario: prodAtual.precounitario || prodAtual.preco || itemDoCarrinho.precoUnitario || 0
                };
            }
            return itemDoCarrinho;
        }).filter(item => item && (item.nomeproduto || item.precoUnitario));

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
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding-right: 8px; width: 100%;';

        const nome = item.nomeproduto;
        const preco = item.precoUnitario || 0;
        const quantidade = item.quantidadeEmEstoque;

        if (nome && quantidade) {
            const textoItem = document.createElement('span');
            textoItem.textContent = `${nome} - Qtd: ${quantidade} - Preço: R$ ${(quantidade * preco).toFixed(2)}`;
            li.appendChild(textoItem);

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Remover';
            btnExcluir.onclick = () => excluirItemCarrinho(item.idproduto);
            
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
        const novoCarrinho = carrinho.filter(item => {
            const itemId = item.idproduto || item.idProduto;
            return String(itemId) !== String(idProduto);
        });
        localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
        mostrarCarrinho();
    }
}

// =======================================================
// === FUNÇÕES DE FLUXO DE PAGAMENTO ===
// =======================================================
function mostrarFormaPagamento() {
    if (window.carrinhoVazio) {
        alert('Escolha algum produto da loja para continuar a compra.');
        return;
    }
    // Permite continuar mesmo se não estiver logado no localStorage, 
    // mas o ideal é verificar. Se for gerente, assume logado.
    document.getElementById('forma-pagamento').style.display = 'block';
    document.getElementById('btn-finalizar-compra').style.display = 'none';
}

function pagarComCartao() {
    idFormaPagamentoSelecionada = 1; // Define ID Cartão
    document.getElementById('pagamento-cartao').style.display = 'block';
    document.getElementById('pagamento-pix').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'none';
}

function pagarPIX() {
    idFormaPagamentoSelecionada = 2; // Define ID PIX
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
    
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrDiv, payloadFinal);
    }
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
    concluirCompra();
}

function formatarCartao(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

// =======================================================
// === FUNÇÕES DE COMUNICAÇÃO COM O BACKEND (API) ===
// =======================================================

async function enviarPedidoParaBackend(pedido) {
    try {
        let url = `${HOST_BACKEND}/pedido/criarProximoPedido`;
        console.log('Enviando pedido para:', url, pedido);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar pedido: ' + response.statusText);
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Erro na requisição ao backend:', error);
        throw error;
    }
}

async function salvarItemDoPedido(item) {
    let url = `${HOST_BACKEND}/pedidohasproduto`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) {
            console.error(`Erro ao salvar produto ID ${item.produtoidproduto}. Status: ${response.status}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro de conexão ao salvar item:', error);
        return false;
    }
}

// =======================================================
// === FUNÇÃO FINAL: CONCLUIR COMPRA (INTEGRADA) ===
// =======================================================
async function concluirCompra() {
    const btnFinalizar = document.getElementById('btn-finalizar-compra');
    if (btnFinalizar) btnFinalizar.disabled = true;

    try {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio.");
            if (btnFinalizar) btnFinalizar.disabled = false;
            return;
        }

        const cpfClienteLogado = localStorage.getItem('cpfUsuarioLogado') || '11111111111'; // Fallback para teste

        // 1. Montar objeto do Pedido
        const dadosDoPedido = {
            datadopedido: new Date().toISOString().split('T')[0],
            clientepessoacpfpessoa: cpfClienteLogado,
            funcionariopessoacpfpessoa: '11111111111',
            
            // CORREÇÃO: Enviando Valor e Forma de Pagamento
            valorTotal: window.valorFinalCalculado, 
            idFormaPagamento: idFormaPagamentoSelecionada 
        };

        // 2. Enviar Pedido e aguardar ID
        const pedidoCriado = await enviarPedidoParaBackend(dadosDoPedido);

        // CORREÇÃO: O backend retorna { id_pedido: X }, então buscamos id_pedido OU idpedido
        const idPedido = pedidoCriado.id_pedido || pedidoCriado.idpedido;

        if (!idPedido) {
            console.error("Resposta do backend:", pedidoCriado);
            throw new Error("O backend não retornou o ID do pedido gerado.");
        }

        console.log("Pedido criado com ID:", idPedido);

        // 3. Enviar cada item do carrinho para o banco
        for (const item of carrinho) {
            const dadosItem = {
                produtoidproduto: item.idproduto,
                pedidoidpedido: idPedido,
                quantidade: item.quantidadeEmEstoque,
                precounitario: item.precoUnitario
            };
            await salvarItemDoPedido(dadosItem);
        }

        // 4. Sucesso
        localStorage.removeItem('carrinho');
        window.valorFinalCalculado = 0;
        window.carrinhoVazio = true;

        document.getElementById('pagina-carrinho').style.display = 'none';
        document.getElementById('mensagem-final').style.display = 'block';

        const header = document.getElementById('header-carrinho');
        if (header) header.style.display = 'none';

        setTimeout(function () {
            irParaMenu();
        }, 2000);

    } catch (error) {
        alert('Houve um erro ao processar seu pedido: ' + error.message);
        if (btnFinalizar) btnFinalizar.disabled = false;
    }
}

// =======================================================
// === NAVEGAÇÃO ===
// =======================================================
function irParaMenu() {
    // Redireciona para o menu do gerente
    window.location.href = '/frontend-Gerente/menuGerente/menuGerente.html';
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('forma-pagamento').style.display = 'none';
    document.getElementById('pagamento-cartao').style.display = 'none';
    document.getElementById('pagamento-pix').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'none';
    const btnFinalizar = document.getElementById('btn-finalizar-compra');
    if (btnFinalizar) btnFinalizar.style.display = 'block';
});