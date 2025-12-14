// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

// Elementos do DOM
const searchId = document.getElementById('searchId');
const inputNome = document.getElementById('nomeProduto');
const inputImagem = document.getElementById('imagemProduto');
const inputQtd = document.getElementById('quantidadeEmEstoque');
const inputPreco = document.getElementById('precoUnitario');

const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarLista();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnAlterar.addEventListener('click', alterarRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// --- FUNÇÕES UTILITÁRIAS ---

function mostrarMensagem(texto, tipo = 'info') {
    let cor = '#17a2b8';
    if (tipo === 'success') cor = '#28a745';
    if (tipo === 'error') cor = '#dc3545';
    if (tipo === 'warning') cor = '#ffc107';

    messageContainer.innerHTML = `<div class="message ${tipo}" style="background-color:${cor}; color:white; padding:10px; margin-top:10px; border-radius:4px; font-weight:bold;">${texto}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 4000);
}

function bloquearCampos(isSearchMode) {
    if (searchId) searchId.disabled = isSearchMode;
    
    // Libera os campos apenas se estiver em modo de edição/inclusão
    inputNome.disabled = !isSearchMode;
    inputImagem.disabled = !isSearchMode;
    inputQtd.disabled = !isSearchMode;
    inputPreco.disabled = !isSearchMode;
}

function limparFormulario() {
    inputNome.value = '';
    inputImagem.value = '';
    inputQtd.value = '';
    inputPreco.value = '';
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// --- CRUD ---

async function carregarLista() {
    try {
        const response = await fetch(`${API_BASE_URL}/produto`);
        if (response.ok) {
            const lista = await response.json();
            renderizarTabela(lista);
        } else {
            throw new Error('Erro ao carregar dados');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista.', 'error');
    }
}

function renderizarTabela(lista) {
    tableBody.innerHTML = '';
    lista.forEach(item => {
        // Leitura tolerante: Tenta minúsculo (banco) e CamelCase
        const id = item.idproduto || item.idProduto;
        const nome = item.nomeproduto || item.nomeProduto;
        const qtd = item.quantidadeemestoque || item.quantidadeEmEstoque;
        const preco = item.precounitario || item.precoUnitario;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" style="cursor:pointer; background:#eee; border:1px solid #ccc; padding:2px 8px;" onclick="selecionarId(${id})">
                    ${id}
                </button>
            </td>
            <td>${nome}</td>
            <td>${qtd}</td>
            <td>R$ ${parseFloat(preco).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function selecionarId(id) {
    searchId.value = id;
    await buscarRegistro();
}

async function buscarRegistro() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID.', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/produto/${id}`);
        if (response.ok) {
            const item = await response.json();
            
            // ATENÇÃO: Seu produtoController retorna aliases (id_produto, nome_produto...)
            currentId = item.id_produto || item.idproduto;
            searchId.value = currentId;
            
            inputNome.value = item.nome_produto || item.nomeproduto || '';
            inputImagem.value = item.imagem_produto || item.imagemproduto || '';
            inputQtd.value = item.quantidade_em_estoque || item.quantidadeemestoque || 0;
            inputPreco.value = item.preco_unitario || item.precounitario || 0;

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Encontrado!', 'success');
            bloquearCampos(false); 
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            currentId = null;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Não encontrado. Pode incluir.', 'info');
            bloquearCampos(false);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar.', 'error');
    }
}

function incluirRegistro() {
    operacao = 'incluir';
    
    // Limpa ID para auto-incremento
    searchId.value = ''; 
    currentId = null;

    limparFormulario();
    bloquearCampos(true); 
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
    mostrarMensagem('Preencha e Salve.', 'info');
}

function alterarRegistro() {
    operacao = 'alterar';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
    mostrarMensagem('Edite e Salve.', 'info');
}

function excluirRegistro() {
    if (!currentId) {
        mostrarMensagem('Busque primeiro.', 'warning');
        return;
    }
    operacao = 'excluir';
    mostrarBotoes(false, false, false, false, true, true);
    mostrarMensagem('Confirme clicando em Salvar.', 'warning');
}

function cancelarOperacao() {
    limparFormulario();
    searchId.value = '';
    operacao = null;
    currentId = null;
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
    searchId.focus();
    mostrarMensagem('Cancelado.', 'info');
}

async function salvarOperacao() {
    const valorNome = inputNome.value;
    const valorImagem = inputImagem.value;
    const valorQtd = inputQtd.value;
    const valorPreco = inputPreco.value;
    
    // ID vazio = Null (para auto-incremento funcionar)
    const valorId = (searchId.value && searchId.value.trim() !== '') ? searchId.value : null;

    if (operacao !== 'excluir' && (!valorNome || !valorQtd || !valorPreco)) {
        mostrarMensagem('Nome, Qtd e Preço são obrigatórios!', 'warning');
        return;
    }

    // JSON com as chaves que o criarProduto espera
    const dados = {
        idProduto: valorId,
        nomeProduto: valorNome,
        imagemProduto: valorImagem,
        quantidadeEmEstoque: parseInt(valorQtd),
        precoUnitario: parseFloat(valorPreco)
    };

    let response = null;
    const headers = { 'Content-Type': 'application/json' };

    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/produto`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(dados)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/${currentId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(dados)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/produto/${currentId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Sucesso: ${operacao}!`, 'success');
            searchId.value = '';
            limparFormulario();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            carregarLista();
            operacao = null;
            currentId = null;
        } else {
            const err = await response.json();
            mostrarMensagem(err.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro Fatal:', error);
        mostrarMensagem('Erro de conexão.', 'error');
    }
}