

// Localização do backend e variáveis globais
let usuarioLogado = localStorage.getItem('usuarioLogado');
const HOST_BACKEND = 'http://localhost:3001';

// Variáveis globais para o cálculo
window.valorFinalCalculado = 0;
window.carrinhoVazio = true;

// NOVA VARIÁVEL: Guarda o ID da forma de pagamento (1=Cartão, 2=PIX)
let idFormaPagamentoSelecionada = 1; // Começa com 1 (Cartão) por padrão

// =======================================================
// === FUNÇÃO PRINCIPAL: MOSTRAR/RECARREGAR CARRINHO ===
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
                    // Chaves salvas no produto.html (id e quantidade selecionada)
                    idproduto: itemDoCarrinho.idproduto,
                    quantidadeEmEstoque: itemDoCarrinho.quantidadeEmEstoque, // OBS: Assumindo que essa var guarda a QTD comprada

                    // Chaves do backend (nome e preço atualizados)
                    nomeproduto: prodAtual.nomeproduto,
                    precoUnitario: prodAtual.precounitario || 0
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
        window.location.href = 'http://localhost:3001/login/abrirTelaLogin';
        return;
    }
    document.getElementById('forma-pagamento').style.display = 'block';
    document.getElementById('btn-finalizar-compra').style.display = 'none';
}

function pagarComCartao() {
    idFormaPagamentoSelecionada = 1; // <--- DEFINE COMO CARTÃO
    document.getElementById('pagamento-cartao').style.display = 'block';
    document.getElementById('pagamento-pix').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'none';
}

function pagarPIX() {
    idFormaPagamentoSelecionada = 2; // <--- DEFINE COMO PIX
    document.getElementById('pagamento-pix').style.display = 'block';
    document.getElementById('pagamento-cartao').style.display = 'none';
    document.getElementById('qrcode-area').style.display = 'block';
    pagarComPix();
}

function pagarComPix() {
    idFormaPagamentoSelecionada = 2; // <--- GARANTIA
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

// // 1. Cria o Pedido (Cabeçalho)
// async function enviarPedidoParaBackend(pedido) {
//     try {
//         let url = `${HOST_BACKEND}/pedido/criarProximoPedido`;
//         console.log('Enviando pedido para:', url);

//         const response = await fetch(url, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(pedido)
//         });

//         if (!response.ok) {
//             throw new Error('Erro ao criar pedido: ' + response.statusText);
//         }

//         const data = await response.json();
//         return data; // Deve retornar objeto com { idpedido: ... }
//     } catch (error) {
//         console.error('Erro na requisição ao backend:', error);
//         throw error;
//     }
// }

async function enviarPedidoParaBackend(pedido) {
    try {
        let url = `${HOST_BACKEND}/pedido/criarProximoPedido`;
        console.log('Enviando pedido para:', url);
        console.log('Dados do pedido enviado:', pedido);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        console.log('Status da resposta:', response.status);
        console.log('Status texto:', response.statusText);
        console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

        // Tente pegar o texto da resposta antes de fazer .json()
        const responseText = await response.text();
        console.log('Resposta em texto:', responseText);

        if (!response.ok) {
            // Mostre mais detalhes do erro
            console.error('Erro detalhado:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });
            throw new Error(`Erro ao criar pedido: ${response.status} ${response.statusText} - ${responseText}`);
        }

        // Tente fazer parse do JSON
        try {
            const data = JSON.parse(responseText);
            console.log('Dados parseados:', data);
            return data;
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            console.error('Texto que falhou no parse:', responseText);
            throw new Error('Resposta do servidor não é um JSON válido');
        }
    } catch (error) {
        console.error('Erro completo na requisição:', error);
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
    if (btnFinalizar) btnFinalizar.disabled = true;

    try {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

        // Debug: Mostrar carrinho atual
        console.log('Carrinho atual:', carrinho);
        console.log('Primeiro item do carrinho:', carrinho[0]);

        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio.");
            if (btnFinalizar) btnFinalizar.disabled = false;
            return;
        }

        // 1. Verificar CPF do cliente
        const cpfClienteLogado = localStorage.getItem('cpfUsuarioLogado');
        if (!cpfClienteLogado) {
            if (btnFinalizar) btnFinalizar.disabled = false;

            // Salvar o carrinho atual para recuperar após o login
            const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho')) || [];
            if (carrinhoAtual.length > 0) {
                localStorage.setItem('carrinhoAntesDoLogin', JSON.stringify(carrinhoAtual));
            }

            // Redirecionar para a tela de login
            window.location.href = 'http://localhost:3001/login/abrirTelaLogin?redirect=carrinho';   //<<<<<<<<<<<<<<<<<<<<<<< essa parte requer atenção
            return;
        }

        // 2. Montar objeto do Pedido
            const dadosDoPedido = {
            datadopedido: formatarDataParaYYYYMMDD(new Date()),
            clientepessoacpfpessoa: cpfClienteLogado,
            funcionariopessoacpfpessoa: null, 
            
            // ADICIONE ESTES DOIS CAMPOS:
            valorTotal: window.valorFinalCalculado, // Envia o valor total para salvar no Pagamento
            idFormaPagamento: idFormaPagamentoSelecionada // Envia 1 ou 2
        };

        console.log('Dados do pedido a ser enviado:', dadosDoPedido);

        // 3. Enviar Pedido
        const pedidoCriado = await enviarPedidoParaBackend(dadosDoPedido);

        // Debug: Verificar resposta do backend
        console.log('Resposta completa do backend:', pedidoCriado);

        // ⚠️ ATENÇÃO: O backend retorna { id_pedido: X } (com underline)
        // Mas você está tentando acessar .idpedido (sem underline)
        const idPedido = pedidoCriado.id_pedido || pedidoCriado.idpedido;

        console.log('ID do pedido extraído:', idPedido);

        if (!idPedido) {
            console.error('Estrutura da resposta inesperada:', pedidoCriado);
            throw new Error("Não foi possível obter o ID do pedido criado. Resposta: " + JSON.stringify(pedidoCriado));
        }

        console.log("Pedido criado com ID:", idPedido);

        // 4. Enviar cada item do carrinho
        for (const item of carrinho) {

            const quantidadeCompra = item.quantidade || item.quantidadeEmEstoque || item.qtd || 1;

            const dadosItem = {
                produtoidproduto: item.idproduto,
                pedidoidpedido: idPedido,
                quantidade: quantidadeCompra, //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< o erro estava aqui
                precounitario: item.precoUnitario || item.preco
            };

            console.log('Enviando item:', dadosItem);
            await salvarItemDoPedido(dadosItem);
        }

        // 5. Sucesso
        localStorage.removeItem('carrinho');
        window.valorFinalCalculado = 0;
        window.carrinhoVazio = true;

        // Feedback visual
        document.getElementById('pagina-carrinho').style.display = 'none';
        document.getElementById('mensagem-final').style.display = 'block';

        const header = document.getElementById('header-carrinho');
        if (header) header.style.display = 'none';

        // Redirecionar
        setTimeout(() => {
            window.location.href = 'http://localhost:3001/menu';
        }, 2000);

    } catch (error) {
        console.error('Erro detalhado em concluirCompra:', error);
        alert('Houve um erro ao processar seu pedido: ' + error.message);
        if (btnFinalizar) btnFinalizar.disabled = false;
    }
}

// Função auxiliar para formatar data
function formatarDataParaYYYYMMDD(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
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