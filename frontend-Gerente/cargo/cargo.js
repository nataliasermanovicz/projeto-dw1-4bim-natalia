// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('cargoForm');
const searchId = document.getElementById('searchId');
const inputNome = document.getElementById('nomecargo'); 

const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const cargosTableBody = document.getElementById('cargosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarCargos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarCargo);
btnIncluir.addEventListener('click', incluirCargo);
btnAlterar.addEventListener('click', alterarCargo);
btnExcluir.addEventListener('click', excluirCargo);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Estado inicial
mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false); 

// --- FUNÇÕES DE UTILIDADE ---

function mostrarMensagem(texto, tipo = 'info') {
    let cor = '#17a2b8'; // Azul (Info) padrão
    if (tipo === 'success') cor = '#28a745'; // Verde
    if (tipo === 'error') cor = '#dc3545';   // Vermelho
    if (tipo === 'warning') cor = '#ffc107'; // Amarelo

    messageContainer.innerHTML = `
        <div class="message ${tipo}" style="background-color: ${cor}; color: white; padding: 10px; border-radius: 4px; margin-top: 10px; font-weight: bold;">
            ${texto}
        </div>
    `;
    
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

function bloquearCampos(isSearchMode) {
    if (searchId) searchId.disabled = isSearchMode;
    if (inputNome) inputNome.disabled = !isSearchMode;
}

function limparFormulario() {
    if (inputNome) inputNome.value = '';
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// --- FUNÇÕES DO CRUD ---

async function carregarCargos() {
    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (response.ok) {
            const cargos = await response.json();
            renderizarTabelaCargos(cargos);
        } else {
            throw new Error('Erro ao carregar cargos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de cargos', 'error');
    }
}

function renderizarTabelaCargos(cargos) {
    cargosTableBody.innerHTML = '';
    cargos.forEach(cargo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" style="cursor: pointer; background: #eee; border: 1px solid #ccc; padding: 2px 8px;" onclick="selecionarCargo(${cargo.idcargo})">
                    ${cargo.idcargo}
                </button>
            </td>
            <td>${cargo.nomecargo}</td>
        `;
        cargosTableBody.appendChild(row);
    });
}

async function selecionarCargo(id) {
    searchId.value = id;
    await buscarCargo();
}

async function buscarCargo() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/cargo/${id}`);
        if (response.ok) {
            const cargo = await response.json();
            
            // Preenche os dados
            currentPersonId = cargo.idcargo;
            searchId.value = cargo.idcargo;
            inputNome.value = cargo.nomecargo || '';

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Cargo encontrado!', 'success');
            
            bloquearCampos(false); 

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id; 
            currentPersonId = null; 
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Cargo não encontrado. Pode incluir novo.', 'info');
            bloquearCampos(false);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar cargo', 'error');
    }
}

function incluirCargo() {
    mostrarMensagem('Preencha os dados e clique em Salvar.', 'success');
    operacao = 'incluir';
    
    // IMPORTANTE: Limpamos o ID para garantir que o backend crie um novo (Auto-Increment)
    searchId.value = '';
    currentPersonId = null;

    limparFormulario(); 
    
    bloquearCampos(true); 
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
}

function alterarCargo() {
    mostrarMensagem('Edite os dados e clique em Salvar.', 'success');
    operacao = 'alterar';
    
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
}

function excluirCargo() {
    if (!currentPersonId) {
        mostrarMensagem('Primeiro busque um cargo válido para excluir.', 'warning');
        return;
    }

    mostrarMensagem('Clique em Salvar para confirmar a exclusão.', 'warning');
    operacao = 'excluir';
    
    searchId.disabled = true;
    inputNome.disabled = true;
    
    mostrarBotoes(false, false, false, false, true, true);
}

function cancelarOperacao() {
    limparFormulario();
    searchId.value = '';
    operacao = null;
    currentPersonId = null;
    
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false; 
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

async function salvarOperacao() {
    const valorNome = inputNome.value;
    
    // Se o campo de busca estiver vazio, mandamos null para o backend entender que é auto-increment
    const valorId = (searchId.value && searchId.value.trim() !== '') ? searchId.value : null;

    console.log(`Tentando salvar: Operação=${operacao}, ID=${valorId}, Nome=${valorNome}`);

    if (operacao !== 'excluir' && (!valorNome || valorNome.trim() === '')) {
        mostrarMensagem('O nome do cargo é obrigatório!', 'warning');
        return;
    }

    // =================================================================
    // CORREÇÃO AQUI: Alterado de 'idcargo' para 'idCargo' (Case sensitive)
    // O Backend espera "idCargo" com C maiúsculo.
    // =================================================================
    const cargoData = {
        idCargo: valorId,
        nomecargo: valorNome 
    };

    let response = null;
    const headers = { 'Content-Type': 'application/json' };

    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/cargo`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(cargoData)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/cargo/${currentPersonId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(cargoData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/cargo/${currentPersonId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Sucesso: ${operacao} realizado!`, 'success');
            
            searchId.value = '';
            limparFormulario();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            carregarCargos();
            operacao = null;
            currentPersonId = null;
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
            console.error('Erro API:', errorData);
        }
    } catch (error) {
        console.error('Erro Fatal:', error);
        mostrarMensagem('Erro de conexão com o servidor.', 'error');
    }
}