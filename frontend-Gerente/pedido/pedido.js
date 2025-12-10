// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pedidos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos(); // CORREÇÃO: Descomentado para carregar a lista ao abrir
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        // Lógica ajustada: O searchId geralmente é o primeiro ou tratado separadamente
        if (input.id === 'searchId') {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    document.getElementById('itensTableBody').innerHTML = ''; // Limpa também a tabela de itens visualmente
}


function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarDataParaInputDate(data) {
    if (!data) return '';
    const dataObj = new Date(data);
    if (isNaN(dataObj)) return '';
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para buscar pedido por ID
async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    
    // Preparação visual antes da busca
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');

            // Fazer a requisição dos itens separadamente e carregar na tabela
            await carregarItensDoPedido(pedido.id_pedido);
            
            // Mantém campos bloqueados até clicar em alterar
            bloquearCampos(false); 

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo pedido.', 'info');
            bloquearCampos(false); 
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pedido', 'error');
    }
}

// Função para carregar itens
async function carregarItensDoPedido(pedidoId) {
    try {
        // CORREÇÃO: Rota ajustada para /PedidoHasProduto (conforme seu server.js)
        const responseItens = await fetch(`${API_BASE_URL}/PedidoHasProduto/${pedidoId}`);

        if (responseItens.ok) {
            const itensDoPedido = await responseItens.json();
            renderizerTabelaItensPedido(itensDoPedido || []);
        } else {
            // Se der 404 ou outro erro, limpa a tabela de itens
            const itensTableBody = document.getElementById('itensTableBody');
            itensTableBody.innerHTML = '';
        }
    } catch (error) {
        // Ignora erros de rede silenciosamente para itens ou limpa a tabela
        const itensTableBody = document.getElementById('itensTableBody');
        itensTableBody.innerHTML = '';
    }
}

// Função para preencher formulário com dados da pedido
function preencherFormulario(pedido) {
    currentPersonId = pedido.id_pedido;
    searchId.value = pedido.id_pedido;
    document.getElementById('data_pedido').value = formatarDataParaInputDate(pedido.data_pedido);

    // CORREÇÃO: Usando os IDs com underscores para combinar com HTML e Controller
    document.getElementById('cliente_pessoa_cpf_pessoa').value = pedido.cliente_pessoa_cpf_pessoa || '';
    document.getElementById('funcionario_pessoa_cpf_pessoa').value = pedido.funcionario_pessoa_cpf_pessoa || '';
}


// Função para incluir pedido
async function incluirPedido() {
    mostrarMensagem('Digite os dados e adicione itens!', 'success');
    currentPersonId = searchId.value;
    
    limparFormulario();
    searchId.value = currentPersonId; // Restaura o ID digitado
    document.getElementById('itensTableBody').innerHTML = ''; // Garante tabela de itens vazia
    
    bloquearCampos(true); // Desbloqueia campos de input

    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('data_pedido').focus();
    operacao = 'incluir';
}

// Função para alterar pedido
async function alterarPedido() {
    mostrarMensagem('Edite os dados!', 'success');
    bloquearCampos(true); // Desbloqueia campos
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('data_pedido').focus();
    operacao = 'alterar';
}

// Função para excluir pedido
async function excluirPedido() {
    if(!confirm("Deseja realmente excluir este pedido?")) return;

    mostrarMensagem('Excluindo pedido...', 'info');
    currentPersonId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false); 
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
    
    // Chama salvarOperacao imediatamente para processar a exclusão
    salvarOperacao();
}

async function salvarOperacao() {
    console.log('Operação:', operacao);

    // CORREÇÃO: Pegando valores diretamente pelos IDs para garantir compatibilidade
    const pedido = {
        id_pedido: searchId.value,
        data_pedido: document.getElementById('data_pedido').value,
        cliente_pessoa_cpf_pessoa: document.getElementById('cliente_pessoa_cpf_pessoa').value,
        funcionario_pessoa_cpf_pessoa: document.getElementById('funcionario_pessoa_cpf_pessoa').value,
    };

    console.log(pedido);

    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
            // Não limpamos itens aqui pois podem haver itens existentes
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Pedido excluído com sucesso!', 'success');
            } else {
                const novaPedido = await response.json();
                mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
                // Se for inclusão, atualiza o ID para permitir adicionar itens
                searchId.value = novaPedido.id_pedido || pedido.id_pedido;
                currentPersonId = searchId.value;
            }
            
            limparFormulario();
            carregarPedidos(); // Atualiza a tabela geral
            
            // Retorna ao estado inicial
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            searchId.focus();

        } else {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao conectar com o servidor', 'error');
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    document.getElementById('itensTableBody').innerHTML = ''; // Limpa itens visuais
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pedidos
async function carregarPedidos() {
    try {
        const rota = `${API_BASE_URL}/pedido`;
        const response = await fetch(rota);

        if (response.ok) {
            const pedidos = await response.json();
            renderizarTabelaPedidos(pedidos);
        } else {
             throw new Error('Erro ao carregar lista');
        }

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pedidos', 'error');
    }
}

// Função para renderizar tabela de pedidos
function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';

    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPedido(${pedido.id_pedido})">
                    ${pedido.id_pedido}
                </button>
            </td>
            <td>${formatarData(pedido.data_pedido)}</td>
            <td>${pedido.cliente_pessoa_cpf_pessoa}</td>
            <td>${pedido.funcionario_pessoa_cpf_pessoa}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

// Função para selecionar pedido da tabela
async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}


// --- Lógica de Itens do Pedido ---

// Função para adicionar uma nova linha vazia para um item na tabela de itens do pedido.
function adicionarItem() {
    // Verifica se já temos um pedido salvo/selecionado
    if (!searchId.value) {
         mostrarMensagem('Selecione ou salve o pedido antes de adicionar itens.', 'warning');
         return;
    }

    const itensTableBody = document.getElementById('itensTableBody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="number" class="pedido-id-input" value="${searchId.value}" disabled>
        </td>
        <td class="produto-group">
            <input type="number" class="produto-id-input">
            <button class="btn-secondary btn-small" onclick="buscarProdutoPorId(this)">?</button>
        </td>
        <td>
            <span class="produto-nome-input" id="produto-nome-input">...</span>
        </td>
        <td>
            <input type="number" class="quantidade-input" value="1" min="1">
        </td>
        <td>
            <input type="number" class="preco-input" value="0.00" min="0" step="0.01">
        </td>
        <td class="subtotal-cell">0,00</td>
        <td>
            <button class="btn-secondary btn-small" onclick="btnAdicionarItem(this)">Salvar</button>
        </td>
        <td>
            <button class="btn-secondary btn-small" onclick="btnCancelarItem(this)">Cancelar</button>
        </td>
    `;
    itensTableBody.appendChild(row);

    adicionarEventListenersSubtotal();
}


// Função para buscar o produto por ID no banco de dados
async function buscarProdutoPorId(button) {
    const row = button.closest('tr');
    const produtoIdInput = row.querySelector('.produto-id-input');
    const produtoId = produtoIdInput.value;

    if (!produtoId) {
        mostrarMensagem('Insira um ID de produto.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produto/${produtoId}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }

        const produto = await response.json();

        const precoInput = row.querySelector('.preco-input');
        precoInput.value = produto.preco_unitario;

        const nome_produtoInput = row.querySelector('.produto-nome-input');
        nome_produtoInput.innerHTML = produto.nome_produto;

        // Atualiza o subtotal da linha simulando input
        precoInput.dispatchEvent(new Event('input'));

        mostrarMensagem(`Produto ${produto.nome_produto} encontrado!`, 'success');

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        mostrarMensagem(error.message, 'error');
    }
}


// Função para coletar os dados de uma nova linha e enviar ao servidor
function btnAdicionarItem(button) {
    const row = button.closest('tr');
    if (!row) return;

    const pedidoId = row.querySelector('.pedido-id-input').value;
    const produtoId = row.querySelector('.produto-id-input').value;
    const quantidade = row.querySelector('.quantidade-input').value;
    const precoUnitario = row.querySelector('.preco-input').value;

    const itemData = {
        pedido_id_pedido: parseInt(pedidoId),
        produto_id_produto: parseInt(produtoId),
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    if (isNaN(itemData.pedido_id_pedido) || isNaN(itemData.produto_id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
        mostrarMensagem('Preencha todos os campos corretamente.', 'warning');
        return;
    }

    // CORREÇÃO: Rota ajustada para /PedidoHasProduto
    fetch(`${API_BASE_URL}/PedidoHasProduto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao adicionar item.');
        }
        return response.json();
    })
    .then(data => {
        mostrarMensagem('Item adicionado!', 'success');
        // Recarrega a tabela de itens para mostrar o estado atualizado (com botão de excluir/atualizar corretos)
        carregarItensDoPedido(pedidoId);
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarMensagem(error.message, 'error');
    });
}

function btnCancelarItem(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
        mostrarMensagem('Cancelado.', 'info');
    }
}

function btnAtualizarItem(button) {
    const row = button.closest('tr');
    if (!row) return;

    // Obtendo dados das células (assumindo a ordem da função renderizerTabelaItensPedido)
    const pedidoId = row.cells[0].textContent;
    const produtoId = row.cells[1].textContent;
    
    // Inputs dentro das células
    const quantidade = row.querySelector('.quantidade-input').value;
    const precoUnitario = row.querySelector('.preco-input').value;

    const itemData = {
        pedido_id_pedido: parseInt(pedidoId),
        produto_id_produto: parseInt(produtoId),
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    if (isNaN(itemData.pedido_id_pedido) || isNaN(itemData.produto_id_produto) || isNaN(itemData.quantidade)) {
        mostrarMensagem('Dados inválidos.', 'warning');
        return;
    }

    // CORREÇÃO: Rota ajustada para /PedidoHasProduto
    fetch(`${API_BASE_URL}/PedidoHasProduto/${itemData.pedido_id_pedido}/${itemData.produto_id_produto}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro ao atualizar item.');
        return response.json();
    })
    .then(data => {
        mostrarMensagem('Item atualizado!', 'success');
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarMensagem(error.message, 'error');
    });
}

function btnExcluirItem(button) {
    const row = button.closest('tr');
    if (!row) return;

    const pedidoId = row.cells[0].textContent;
    const produtoId = row.cells[1].textContent;

    if (!confirm(`Excluir produto ${produtoId} do pedido ${pedidoId}?`)) return;

    // CORREÇÃO: Rota ajustada para /PedidoHasProduto
    fetch(`${API_BASE_URL}/PedidoHasProduto/${pedidoId}/${produtoId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            row.remove();
            mostrarMensagem('Item excluído!', 'success');
        } else {
            throw new Error('Erro ao excluir item.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarMensagem(error.message, 'error');
    });
}

function renderizerTabelaItensPedido(itens) {
    const itensTableBody = document.getElementById('itensTableBody');
    itensTableBody.innerHTML = '';

    if (typeof itens === 'object' && !Array.isArray(itens)) {
        itens = [itens];
    }

    itens.forEach((item, index) => {
        const row = document.createElement('tr');
        let subTotal = item.quantidade * item.preco_unitario;
        subTotal = subTotal.toFixed(2).replace('.', ',');

        row.innerHTML = `
            <td>${item.pedido_id_pedido}</td>
            <td>${item.produto_id_produto}</td>
            <td>${item.nome_produto || 'Produto ' + item.produto_id_produto}</td>
            <td>
                <input type="number" class="quantidade-input" data-index="${index}" 
                       value="${item.quantidade}" min="1">
            </td>
            <td>
                <input type="number" class="preco-input" data-index="${index}" 
                       value="${item.preco_unitario}" min="0" step="0.01">
            </td>
            <td class="subtotal-cell">${subTotal}</td>
            <td>
               <button class="btn-secondary btn-small" onclick="btnAtualizarItem(this)">Atualizar</button>
            </td>
            <td>
                 <button class="btn-secondary btn-small" onclick="btnExcluirItem(this)">Excluir</button>
            </td>
        `;
        itensTableBody.appendChild(row);
    });

    adicionarEventListenersSubtotal();
}

function adicionarEventListenersSubtotal() {
    const quantidadeInputs = document.querySelectorAll('.quantidade-input');
    const precoInputs = document.querySelectorAll('.preco-input');

    quantidadeInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });

    precoInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });
}

function atualizarSubtotal(event) {
    const row = event.target.closest('tr');
    const quantidadeInput = row.querySelector('.quantidade-input');
    const precoInput = row.querySelector('.preco-input');
    const subtotalCell = row.querySelector('.subtotal-cell');

    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const preco = parseFloat(precoInput.value) || 0;

    const novoSubtotal = quantidade * preco;
    subtotalCell.textContent = novoSubtotal.toFixed(2).replace('.', ',');
}