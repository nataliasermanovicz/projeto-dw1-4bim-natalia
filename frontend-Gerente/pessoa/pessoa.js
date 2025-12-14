// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

// Elementos do DOM
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inputs do Formulário
const inputNome = document.getElementById('nomePessoa');
const inputDataNasc = document.getElementById('dataNascimentoPessoa');
const inputEndereco = document.getElementById('EnderecoIdEndereco');
const inputSenha = document.getElementById('senhaPessoa');
const inputEmail = document.getElementById('emailPessoa');

// Inputs Extras
const checkFuncionario = document.getElementById('checkboxFuncionario');
const selectCargo = document.getElementById('CargosIdCargo');
const inputSalario = document.getElementById('salario');
const checkCliente = document.getElementById('checkboxCliente');
const inputRenda = document.getElementById('rendaCliente');
const inputDataCadastro = document.getElementById('dataDeCadastroCliente');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarLista();
    carregarCargos(); // Importante carregar o select de cargos
});

// Event Listeners
btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnAlterar.addEventListener('click', alterarRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

checkFuncionario.addEventListener('change', toggleCamposFuncionario);
checkCliente.addEventListener('change', toggleCamposCliente);

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
    // Se isSearchMode=true (Editando): Bloqueia Busca, Libera Inputs
    // Se isSearchMode=false (Buscando): Libera Busca, Bloqueia Inputs
    
    if (searchId) searchId.disabled = isSearchMode;
    
    const inputs = [inputNome, inputDataNasc, inputEndereco, inputSenha, inputEmail];
    inputs.forEach(input => { if(input) input.disabled = !isSearchMode; });

    // Checkboxes sempre seguem o modo de edição
    checkFuncionario.disabled = !isSearchMode;
    checkCliente.disabled = !isSearchMode;
    
    // Atualiza o estado dos campos dependentes (Salario, Renda...)
    // Se não estiver editando, força bloqueio. Se estiver, obedece o checkbox.
    toggleCamposFuncionario();
    toggleCamposCliente();
}

function toggleCamposFuncionario() {
    // Só habilita se o checkbox estiver marcado E estivermos em modo de edição (searchId bloqueado)
    const emModoEdicao = searchId.disabled === true;
    const habilitar = checkFuncionario.checked && emModoEdicao;
    
    selectCargo.disabled = !habilitar;
    inputSalario.disabled = !habilitar;
}

function toggleCamposCliente() {
    const emModoEdicao = searchId.disabled === true;
    const habilitar = checkCliente.checked && emModoEdicao;
    
    inputRenda.disabled = !habilitar;
    inputDataCadastro.disabled = !habilitar;
}

function limparFormulario() {
    inputNome.value = '';
    inputDataNasc.value = '';
    inputEndereco.value = '';
    inputSenha.value = '';
    inputEmail.value = '';
    
    checkFuncionario.checked = false;
    selectCargo.value = "";
    inputSalario.value = '';
    
    checkCliente.checked = false;
    inputRenda.value = '';
    inputDataCadastro.value = '';
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function formatarDataInput(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toISOString().split('T')[0];
}

// --- CARREGAMENTO DE DADOS ---

async function carregarCargos() {
    try {
        // Assume que existe rota de cargos. Se não existir, ignore o erro no console.
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if(response.ok) {
            const cargos = await response.json();
            selectCargo.innerHTML = '<option value="">Selecione um Cargo</option>';
            cargos.forEach(c => {
                // Tenta ler idCargo (CamelCase) ou idcargo (minúsculo)
                const id = c.idCargo || c.idcargo;
                const nome = c.nomeCargo || c.nomecargo;
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nome;
                selectCargo.appendChild(option);
            });
        }
    } catch(e) { console.warn("Não foi possível carregar cargos para o select."); }
}

async function carregarLista() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);
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
        const cpf = item.cpfpessoa || item.cpfPessoa;
        const nome = item.nomepessoa || item.nomePessoa;
        const email = item.emailpessoa || item.emailPessoa;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" style="cursor:pointer;" onclick="selecionarId('${cpf}')">${cpf}</button></td>
            <td>${nome}</td>
            <td>${item.datanascimentopessoa ? new Date(item.datanascimentopessoa).toLocaleDateString() : ''}</td>
            <td>${item.enderecoidendereco || ''}</td>
            <td>***</td>
            <td>${email}</td>
        `;
        tableBody.appendChild(row);
    });
}

// --- AÇÕES DO CRUD ---

async function selecionarId(id) {
    searchId.value = id;
    await buscarRegistro();
}

async function buscarRegistro() {
    const id = searchId.value.trim();
    if (!id) { mostrarMensagem('Digite um CPF.', 'warning'); return; }
    
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${id}`);
        if (response.ok) {
            const item = await response.json();
            
            currentId = item.cpfpessoa || item.cpfPessoa;
            searchId.value = currentId;
            
            // Preenche Pessoa
            inputNome.value = item.nomepessoa || item.nomePessoa || '';
            inputEmail.value = item.emailpessoa || item.emailPessoa || '';
            inputSenha.value = item.senhapessoa || item.senhaPessoa || '';
            inputEndereco.value = item.enderecoidendereco || item.EnderecoIdEndereco || '';
            
            const dataNasc = item.datanascimentopessoa || item.dataNascimentoPessoa;
            inputDataNasc.value = formatarDataInput(dataNasc);

            // === PREENCHE DADOS EXTRAS (Vindo do JOIN no Controller) ===
            
            // Funcionario: Verifica se tem salário ou cargo
            if (item.salario || item.cargosidcargo || item.CargosIdCargo) {
                checkFuncionario.checked = true;
                inputSalario.value = item.salario || '';
                selectCargo.value = item.cargosidcargo || item.CargosIdCargo || '';
            } else {
                checkFuncionario.checked = false;
                inputSalario.value = '';
                selectCargo.value = '';
            }

            // Cliente: Verifica se tem renda
            if (item.rendacliente || item.rendaCliente) {
                checkCliente.checked = true;
                inputRenda.value = item.rendacliente || item.rendaCliente || '';
                const dataCad = item.datadecadastrocliente || item.dataDeCadastroCliente;
                inputDataCadastro.value = formatarDataInput(dataCad);
            } else {
                checkCliente.checked = false;
                inputRenda.value = '';
                inputDataCadastro.value = '';
            }

            // Atualiza visual dos campos bloqueados
            toggleCamposFuncionario();
            toggleCamposCliente();

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Encontrado!', 'success');
            bloquearCampos(false); 
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id; 
            currentId = null;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('CPF não encontrado. Pode incluir.', 'info');
            bloquearCampos(false);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar.', 'error');
    }
}

function incluirRegistro() {
    operacao = 'incluir';
    currentId = searchId.value; 
    
    if(!currentId) {
        mostrarMensagem('Digite o CPF no campo de busca para incluir.', 'warning');
        searchId.focus();
        return;
    }

    limparFormulario();
    bloquearCampos(true); 
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
    mostrarMensagem('Preencha os dados e Salve.', 'info');
}

function alterarRegistro() {
    operacao = 'alterar';
    bloquearCampos(true); // Isso vai liberar os checkboxes
    mostrarBotoes(false, false, false, false, true, true);
    inputNome.focus();
    mostrarMensagem('Edite e Salve.', 'info');
}

function excluirRegistro() {
    if (!currentId) { mostrarMensagem('Busque primeiro.', 'warning'); return; }
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
    const valorId = searchId.value;

    if (!valorId) { mostrarMensagem('CPF é obrigatório!', 'warning'); return; }

    if (operacao !== 'excluir') {
        if (!inputNome.value || !inputEmail.value || !inputSenha.value) {
            mostrarMensagem('Nome, Email e Senha são obrigatórios!', 'warning');
            return;
        }
    }

    // Objeto completo
    const dados = {
        cpfPessoa: valorId,
        nomePessoa: inputNome.value,
        emailPessoa: inputEmail.value,
        senhaPessoa: inputSenha.value,
        dataNascimentoPessoa: inputDataNasc.value || null,
        EnderecoIdEndereco: parseInt(inputEndereco.value) || null,
        
        // Dados Extras para o Controller evoluído
        isFuncionario: checkFuncionario.checked,
        CargosIdCargo: selectCargo.value || null,
        salario: inputSalario.value || null,
        
        isCliente: checkCliente.checked,
        rendaCliente: inputRenda.value || null,
        dataDeCadastroCliente: inputDataCadastro.value || null
    };

    let response = null;
    const headers = { 'Content-Type': 'application/json' };

    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(dados)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(dados)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentId}`, {
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