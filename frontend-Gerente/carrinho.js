// Localização do backend e variáveis globais
let usuarioLogado = localStorage.getItem('usuarioLogado');
const HOST_BACKEND = 'http://localhost:3001';

// Variáveis globais para o cálculo
window.valorFinalCalculado = 0;
window.carrinhoVazio = true;

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
        const preco = item.precoUnitario || item.precounitario || item.preco || item.price || item.precoUnitario || 0;
        return { idproduto: id, quantidadeEmEstoque: quantidade, nomeproduto: nome, precoUnitario: preco };
    }

    let carrinho = carrinhoRaw.map(normalizeItem).filter(i => i && i.idproduto !== undefined && i.idproduto !== null);

    try {
        // Busca os dados atualizados dos produtos no backend
        const res = await fetch(`${HOST_BACKEND}/produto`);
        const produtosBackend = await res.json();

        // Mapeia o carrinho salvo no localStorage com os dados do backend
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
            btnExcluir.onclick = () => excluirItemCarrinho(item.idproduto);
            btnExcluir.style.cssText = 'background-color: #dc3545; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 14px; width: auto; min-height: 30px; margin: 0 0 0 10px; flex-shrink: 0;';
            btnExcluir.onmouseover = function () { this.style.backgroundColor = '#c82333'; };
            btnExcluir.onmouseout = function () { this.style.backgroundColor = '#dc3545'; };

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
        const novoCarrinho = carrinho.filter(item => item.idproduto !== idProduto);
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
    if (localStorage.getItem('usuarioLogado') !== 'true') {
        irParaLogin();
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

// 1. Cria o Pedido (Cabeçalho)
async function enviarPedidoParaBackend(pedido) {
    try {
        let url = `${HOST_BACKEND}/pedido/criarProximoPedido`;
        console.log('Enviando pedido para:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar pedido: ' + response.statusText);
        }

        const data = await response.json();
        return data; // Deve retornar objeto com { idpedido: ... }
    } catch (error) {
        console.error('Erro na requisição ao backend:', error);
        throw error;
    }
}

// 2. Salva Item individualmente no PedidoHasProduto
async function salvarItemDoPedido(item) {
    // ATENÇÃO: Ajuste a rota abaixo se o seu backend usar outro nome
    // Pelo padrão do seu banco, deve ser algo como /pedidohasproduto
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
    // Desabilita botão para evitar cliques duplos
    if (btnFinalizar) btnFinalizar.disabled = true;

    try {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio.");
            if (btnFinalizar) btnFinalizar.disabled = false;
            return;
        }

        const cpfClienteLogado = localStorage.getItem('cpfUsuarioLogado') || '99999999999';

        // 1. Montar objeto do Pedido
        const dadosDoPedido = {
            datadopedido: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            clientepessoacpfpessoa: cpfClienteLogado,
            funcionariopessoacpfpessoa: '11111111111' 
        };

        // 2. Enviar Pedido e aguardar ID
        const pedidoCriado = await enviarPedidoParaBackend(dadosDoPedido);

        if (!pedidoCriado || !pedidoCriado.idpedido) {
            throw new Error("O backend não retornou o ID do pedido gerado.");
        }

        const idPedido = pedidoCriado.idpedido;
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

        // 4. Sucesso: Limpar carrinho e feedback visual
        localStorage.removeItem('carrinho');
        window.valorFinalCalculado = 0;
        window.carrinhoVazio = true;

        document.getElementById('pagina-carrinho').style.display = 'none';
        document.getElementById('mensagem-final').style.display = 'block';

        const header = document.getElementById('header-carrinho');
        if (header) header.style.display = 'none';

        // Redireciona após 2 segundos
        setTimeout(function () {
            irParaMenu();
        }, 2000);

    } catch (error) {
        alert('Houve um erro ao processar seu pedido: ' + error.message);
        if (btnFinalizar) btnFinalizar.disabled = false;
    }
}

// =======================================================
// === FUNÇÕES DE NAVEGAÇÃO E UTILITÁRIOS ===
// =======================================================

// Função auxiliar para login
function irParaLogin() {
    window.location.href = `${HOST_BACKEND}/login/abrirTelaLogin`;
}

/**
 * Função responsável por voltar ao menu correto.
 * Verifica se o usuário é Gerente para definir a rota.
 */
/**
/**
 * Função responsável por voltar ao menu correto.
 */
function irParaMenu() {
    // 1. Pega o valor
    let ehGerente = localStorage.getItem('ehGerente');
    
    console.log("--- DEBUG REAL ---");
    console.log("Valor cru:", ehGerente);

    // 2. Limpeza de segurança (remove espaços e converte para string)
    if (ehGerente) {
        ehGerente = String(ehGerente).trim();
    }

    // 3. Verificação
    if (ehGerente === 'true') {
        console.log("É GERENTE! Tentando ir para ../../frontend-Gerente/menu.html");
        
        // Verifica se a estrutura de pastas está correta
        // Se carrinho.html está em: projeto/frontend/carrinho/
        // ../ volta para frontend/
        // ../../ volta para projeto/
        // então entra em frontend-Gerente/
        window.location.href = '../../frontend-Gerente/menu.html';
        
    } else {
        console.log("É CLIENTE (ou nulo). Voltando para ../menu.html");
        window.location.href = '../menu.html';
    }
}

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('forma-pagamento').style.display = 'none';
    document.getElementById('pagamento-cartao').style.display = 'none';
    document.getElementById('pagamento-pix').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'none';
    const btnFinalizar = document.getElementById('btn-finalizar-compra');
    if (btnFinalizar) btnFinalizar.style.display = 'block';
});