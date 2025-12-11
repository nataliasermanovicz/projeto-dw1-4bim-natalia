/*
 //cpfpessoa, nomepessoa, datanascimentopessoa,enderecoidendereco,senhapessoa, emailpessoa
*/
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pessoas e cargos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
    popularCargosSelect();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
// Estado inicial: libera PK (CPF) e bloqueia os demais campos para evitar edição acidental
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    // bloquearPrimeiro === true => bloqueia o primeiro input (CPF) e libera os demais
    // bloquearPrimeiro === false => libera o primeiro (CPF) e bloqueia os demais
    const inputs = document.querySelectorAll('input, select');

    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();

    // Campos adicionais (1-1) funcionário / cliente
    const chkFunc = document.getElementById('checkboxFuncionario');
    if (chkFunc) chkFunc.checked = false;
    const salarioEl = document.getElementById('salario');
    if (salarioEl) salarioEl.value = '';
    const cargosEl = document.getElementById('cargosidcargo');
    if (cargosEl) cargosEl.value = '';

    const chkCli = document.getElementById('checkboxCliente');
    if (chkCli) chkCli.checked = false;
    const rendaEl = document.getElementById('rendacliente');
    if (rendaEl) rendaEl.value = '';
    const dataCadEl = document.getElementById('datadecadastrocliente');
    if (dataCadEl) dataCadEl.value = '';
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

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    // dataString já vem em formato yyyy-MM-dd do input date, new Date(dataString) funciona bem
    const d = new Date(dataString);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

function converterDataParaFormatoYYYYMMDD(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') {
        return ''; // Retorna vazio se a entrada for nula ou não for string
    }
    const partes = isoDateString.split('T');
    if (partes.length > 0) {
        return partes[0]; // Retorna a primeira parte, que é "yyyy-MM-dd"
    } else {
        return '';
    }
}

async function funcaoEhFuncionario(pessoacpfpessoa) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionario/${pessoacpfpessoa}`);
        if (response.status === 404) {
            return { ehFuncionario: false };
        }
        if (response.status === 200) {
            const funcionarioData = await response.json();
            // Aceita nomes de campos variados vindos do backend
            return {
                ehFuncionario: true,
                salario: funcionarioData.salario ?? funcionarioData.salario ?? funcionarioData.salario ?? '',
                cargosidcargo: funcionarioData.cargosidcargo ?? funcionarioData.cargosidcargo ?? funcionarioData.cargosidcargo ?? funcionarioData.cargosidcargo ?? null
            };
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro na requisição (funcionario):', errorData.error || response.status);
            return { ehFuncionario: false };
        }
    } catch (error) {
        console.error('Erro ao verificar se é funcionario:', error);
        return { ehFuncionario: false };
    }
}

async function funcaoEhCliente(pessoacpfpessoa) {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/${pessoacpfpessoa}`);
        if (response.status === 404) {
            return { ehCliente: false };
        }
        if (response.status === 200) {
            const clienteData = await response.json();
            return {
                ehCliente: true,
                rendacliente: clienteData.rendacliente ?? clienteData.rendacliente ?? clienteData.renda ?? '',
                datadecadastrocliente: clienteData.datadecadastrocliente ?? clienteData.datadecadastrocliente ?? clienteData.datadecadastrocliente ?? null
            };
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro na requisição (cliente):', errorData.error || response.status);
            return { ehCliente: false };
        }
    } catch (error) {
        console.error('Erro ao verificar se é cliente:', error);
        return { ehCliente: false };
    }
}

// Função para buscar pessoa por ID
async function buscarPessoa() {
    const id = String(searchId.value).trim();
    if (!id) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }

    // Bloqueia o CPF e libera os demais campos para edição/visualização quando encontrar ou incluir
    bloquearCampos(true);
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${encodeURIComponent(id)}`);

        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);
            // após preencher, bloqueia o cpf e habilita botões de alterar/excluir
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');
            // garante que CPF fique bloqueado
            searchId.disabled = true;
            bloquearCampos(true);
        } else if (response.status === 404) {
            // pessoa não encontrada — mantém o CPF preenchido e bloqueado para evitar mudanças acidentais
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); // permite incluir
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            // bloqueia o CPF (não quer que mude) e libera os demais campos para inclusão
            searchId.disabled = true;
            bloquearCampos(true);
            document.getElementById('nomepessoa')?.focus();
        } else {
            // outros erros
            const errText = await response.text().catch(() => response.status);
            throw new Error('Erro ao buscar pessoa: ' + errText);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
        // em caso de erro, libera o CPF para tentativa manual
        searchId.disabled = false;
        bloquearCampos(false);
    }
}

// Função para preencher formulário com dados da pessoa, se for funcionario ou cliente, preencher também os dados respectivos.
async function preencherFormulario(pessoa) {
    // aceita diferentes nomes de campos vindos do backend
    const cpf = pessoa.cpfpessoa ?? pessoa.cpfpessoa ?? pessoa.cpfpessoa;
    const nome = pessoa.nomepessoa ?? pessoa.nomepessoa ?? pessoa.nomepessoa;
    const dataNascimento = pessoa.datanascimentopessoa ?? pessoa.datanascimentopessoa ?? pessoa.datanascimentopessoa ?? null;
    const endereco = pessoa.enderecoidendereco ?? pessoa.enderecoidendereco ?? pessoa.enderecoidendereco ?? pessoa.enderecoidendereco ?? '';
    const senha = pessoa.senhapessoa ?? pessoa.senhapessoa ?? pessoa.senhapessoa ?? '';
    const email = pessoa.emailpessoa ?? pessoa.emailpessoa ?? pessoa.emailpessoa ?? '';

    currentPersonId = cpf;
    searchId.value = cpf ?? '';
    document.getElementById('nomepessoa').value = nome || '';

    if (dataNascimento) {
        const d = new Date(dataNascimento);
        if (!isNaN(d.getTime())) {
            document.getElementById('datanascimentopessoa').value = converterDataParaFormatoYYYYMMDD(d.toISOString());
        } else {
            document.getElementById('datanascimentopessoa').value = '';
        }
    } else {
        document.getElementById('datanascimentopessoa').value = '';
    }

    document.getElementById('enderecoidendereco').value = endereco || '';
    document.getElementById('senhapessoa').value = senha || '';
    document.getElementById('emailpessoa').value = email || '';

    // Verifica se a pessoa é funcionario
    const ehFuncionarioEssaPessoa = await funcaoEhFuncionario(currentPersonId);
    if (ehFuncionarioEssaPessoa.ehFuncionario) {
        document.getElementById('checkboxFuncionario').checked = true;
        document.getElementById('cargosidcargo').value = ehFuncionarioEssaPessoa.cargosidcargo ?? '';
        document.getElementById('salario').value = ehFuncionarioEssaPessoa.salario ?? '';
    } else {
        document.getElementById('checkboxFuncionario').checked = false;
        document.getElementById('cargosidcargo').value = '';
        document.getElementById('salario').value = '';
    }

    // Verifica se a pessoa é cliente
    const ehClienteEssaPessoa = await funcaoEhCliente(currentPersonId);
    if (ehClienteEssaPessoa.ehCliente) {
        document.getElementById('checkboxCliente').checked = true;
        document.getElementById('rendacliente').value = ehClienteEssaPessoa.rendacliente ?? '';
        document.getElementById('datadecadastrocliente').value = converterDataParaFormatoYYYYMMDD(ehClienteEssaPessoa.datadecadastrocliente ?? '') || '';
    } else {
        document.getElementById('checkboxCliente').checked = false;
        document.getElementById('rendacliente').value = '';
        document.getElementById('datadecadastrocliente').value = '';
    }
}

// Função para incluir pessoa
async function incluirPessoa() {
    mostrarMensagem('Preencha os dados e clique em Salvar.', 'success');

    // mantém o CPF que foi digitado, bloqueia para evitar alteração enquanto edita
    currentPersonId = searchId.value;
    limparFormulario();
    searchId.value = currentPersonId;
    searchId.disabled = true;
    bloquearCampos(true); // bloqueia CPF, libera demais campos

    mostrarBotoes(false, false, false, false, true, true); // salvar e cancelar
    document.getElementById('nomepessoa')?.focus();
    operacao = 'incluir';
}

// Função para alterar pessoa
async function alterarPessoa() {
    mostrarMensagem('Edite os dados e clique em Salvar.', 'success');
    // bloqueia o CPF para não permitir alteração da PK
    searchId.disabled = true;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nomepessoa')?.focus();
    operacao = 'alterar';
}

// Função para excluir pessoa
async function excluirPessoa() {
    mostrarMensagem('Clique em Salvar para confirmar a exclusão.', 'warning');
    currentPersonId = searchId.value;
    // Bloqueia o CPF e os demais campos para confirmar exclusão
    searchId.disabled = true;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pessoa = {
        cpfpessoa: String(searchId.value || '').trim(),
        nomepessoa: formData.get('nomepessoa'),
        datanascimentopessoa: converterDataParaISO(formData.get('datanascimentopessoa')) || null,
        enderecoidendereco: formData.get('enderecoidendereco'),
        senhapessoa: formData.get('senhapessoa'),
        emailpessoa: formData.get('emailpessoa')
    };

    // capturar dados do funcionario só se checkbox marcado
    let funcionario = null;
    if (document.getElementById('checkboxFuncionario')?.checked) {
        funcionario = {
            pessoa_cpfpessoa: pessoa.cpfpessoa,
            salario: document.getElementById('salario')?.value ?? '',
            cargosidcargo: parseInt(document.getElementById('cargosidcargo')?.value) || null
        };
    }
    const caminhoFunc = `${API_BASE_URL}/funcionario/${encodeURIComponent(currentPersonId ?? pessoa.cpfpessoa)}`;

    // capturar dados do cliente só se checkbox marcado
    let cliente = null;
    if (document.getElementById('checkboxCliente')?.checked) {
        cliente = {
            pessoa_cpfpessoa: pessoa.cpfpessoa,
            rendacliente: document.getElementById('rendacliente')?.value ?? '',
            datadecadastrocliente: document.getElementById('datadecadastrocliente')?.value || null
        };
    }
    const caminhoCliente = `${API_BASE_URL}/cliente/${encodeURIComponent(currentPersonId ?? pessoa.cpfpessoa)}`;

    try {
        let respPessoa = null;
        switch (operacao) {
            ///////////////////////////////////// incluir ///////////////////////////////////////
            case 'incluir':
                // criar pessoa
                respPessoa = await fetch(`${API_BASE_URL}/pessoa`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pessoa)
                });

                if (!respPessoa.ok) {
                    const err = await respPessoa.json().catch(() => ({ error: 'erro' }));
                    throw new Error('Erro ao criar pessoa: ' + (err.error || respPessoa.status));
                }

                // criar funcionario se marcado
                if (funcionario) {
                    const respFunc = await fetch(`${API_BASE_URL}/funcionario`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(funcionario)
                    });
                    if (!respFunc.ok) {
                        console.warn('Aviso: criação de funcionario retornou', respFunc.status);
                    }
                }

                // criar cliente se marcado
                if (cliente) {
                    const respCli = await fetch(`${API_BASE_URL}/cliente`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cliente)
                    });
                    if (!respCli.ok) {
                        console.warn('Aviso: criação de cliente retornou', respCli.status);
                    }
                }

                mostrarMensagem('Pessoa incluída com sucesso!', 'success');
                limparFormulario();
                break;

            ///////////////////////////////////// alterar ///////////////////////////////////////
            case 'alterar':
                respPessoa = await fetch(`${API_BASE_URL}/pessoa/${encodeURIComponent(currentPersonId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pessoa)
                });
                if (!respPessoa.ok) {
                    const err = await respPessoa.json().catch(() => ({ error: 'erro' }));
                    throw new Error('Erro ao alterar pessoa: ' + (err.error || respPessoa.status));
                }

                // tratar cliente: só inserir se NÃO existir; só deletar se EXISTIR
                if (document.getElementById('checkboxCliente')?.checked) {
                    // cliente deve existir: verificar se existe
                    const respVerifCli = await fetch(caminhoCliente);
                    if (respVerifCli.status === 404) {
                        // não existe, criar
                        const respCriarCli = await fetch(`${API_BASE_URL}/cliente/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cliente)
                        });
                        if (!respCriarCli.ok) console.warn('Erro ao criar cliente no alterar', respCriarCli.status);
                    } else if (respVerifCli.status === 200) {
                        // já existe, alterar
                        const respAlterarCli = await fetch(caminhoCliente, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cliente)
                        });
                        if (!respAlterarCli.ok) console.warn('Erro ao alterar cliente no alterar', respAlterarCli.status);
                    } else {
                        console.warn('Erro ao verificar cliente no alterar', respVerifCli.status);
                    }
                } else {
                    // checkbox não marcado -> tentar excluir cliente se existir
                    try {
                        const respCli = await fetch(caminhoCliente, { method: 'DELETE' });
                        if (respCli.status === 409) {
                            const data = await respCli.json().catch(() => ({}));
                            alert(data.error || 'Erro ao excluir cliente (dependências)');
                            document.getElementById('checkboxCliente').checked = true;
                        }
                    } catch (err) {
                        console.error('Erro ao deletar cliente no alterar:', err);
                    }
                }

                // tratar funcionario
                if (document.getElementById('checkboxFuncionario')?.checked) {
                    const respVerifFunc = await fetch(caminhoFunc);
                    if (respVerifFunc.status === 404) {
                        const respCriarFunc = await fetch(`${API_BASE_URL}/funcionario/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                        if (!respCriarFunc.ok) console.warn('Erro ao criar funcionario no alterar', respCriarFunc.status);
                    } else if (respVerifFunc.status === 200) {
                        const respAlterarFunc = await fetch(caminhoFunc, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                        if (!respAlterarFunc.ok) console.warn('Erro ao alterar funcionario no alterar', respAlterarFunc.status);
                    } else {
                        console.warn('Erro ao verificar funcionario no alterar', respVerifFunc.status);
                    }
                } else {
                    // checkbox não marcado -> excluir funcionario se existir
                    try {
                        const respVerifFunc = await fetch(caminhoFunc);
                        if (respVerifFunc.status === 200) {
                            const respDel = await fetch(caminhoFunc, { method: 'DELETE' });
                            if (!respDel.ok) console.warn('Erro ao excluir funcionario no alterar', respDel.status);
                        }
                    } catch (err) {
                        console.error('Erro ao deletar funcionario no alterar:', err);
                    }
                }

                mostrarMensagem('Pessoa alterada com sucesso!', 'success');
                limparFormulario();
                break;

            ///////////////////////////////////// excluir ///////////////////////////////////////
            case 'excluir':
                {
                    // excluir cliente se existir
                    try {
                        const respCli = await fetch(caminhoCliente);
                        if (respCli.status === 200) {
                            await fetch(caminhoCliente, { method: 'DELETE' });
                        }
                    } catch (err) {
                        console.warn('Erro ao verificar/excluir cliente na exclusão:', err);
                    }

                    // excluir funcionario se existir
                    try {
                        const respFuncObter = await fetch(caminhoFunc);
                        if (respFuncObter.status === 200) {
                            await fetch(caminhoFunc, { method: 'DELETE' });
                        }
                    } catch (err) {
                        console.warn('Erro ao verificar/excluir funcionario na exclusão:', err);
                    }

                    // excluir pessoa
                    const respDelPessoa = await fetch(`${API_BASE_URL}/pessoa/${encodeURIComponent(currentPersonId)}`, { method: 'DELETE' });
                    if (!respDelPessoa.ok) {
                        const err = await respDelPessoa.json().catch(() => ({ error: 'erro' }));
                        throw new Error('Erro ao excluir pessoa: ' + (err.error || respDelPessoa.status));
                    }

                    mostrarMensagem('Pessoa excluída com sucesso!', 'success');
                    limparFormulario();
                }
                break;
        }

        // atualizar lista após inclusão/alteração/exclusão
        carregarPessoas();

    } catch (error) {
        console.error('Erro salvarOperacao:', error);
        mostrarMensagem(error.message || 'Erro ao processar operação', 'error');
    } finally {
        mostrarBotoes(true, false, false, false, false, false);
        searchId.disabled = false; // libera campo CPF ao finalizar
        bloquearCampos(false); // bloqueia os demais e libera o CPF por padrão
        document.getElementById('searchId').focus();
        operacao = null;
        currentPersonId = null;
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    searchId.disabled = false;
    bloquearCampos(false); // libera CPF, bloqueia demais enquanto não operando
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
    operacao = null;
    currentPersonId = null;
}

// Função para carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);
        if (response.ok) {
            const pessoas = await response.json();
            renderizarTabelaPessoas(pessoas);
        } else {
            throw new Error('Erro ao carregar pessoas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Função para renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        // Usa chaves alternativas caso o backend retorne nomes diferentes
        const cpf = pessoa.cpfpessoa ?? pessoa.cpfpessoa ?? pessoa.cpfpessoa ?? '';
        const nome = pessoa.nomepessoa ?? pessoa.nomepessoa ?? pessoa.nomepessoa ?? '';
        const data = pessoa.datanascimentopessoa ?? pessoa.datanascimentopessoa ?? pessoa.datanascimentopessoa ?? '';
        const endereco = pessoa.enderecoidendereco ?? pessoa.enderecoidendereco ?? pessoa.enderecoidendereco ?? '';
        const senha = pessoa.senhapessoa ?? pessoa.senhapessoa ?? pessoa.senhapessoa ?? '';
        const email = pessoa.emailpessoa ?? pessoa.emailpessoa ?? pessoa.emailpessoa ?? '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPessoa('${cpf}')">
                    ${cpf}
                </button>
            </td>
            <td>${nome}</td>
            <td>${formatarData(data)}</td>
            <td>${endereco}</td>
            <td>${senha}</td>
            <td>${email}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
}

// Função que busca os cargos no backend e preenche o menu suspenso (select)
async function popularCargosSelect() {
    const selectCargo = document.getElementById('cargosidcargo');
    if (!selectCargo) return;

    // limpa opções, mantendo um placeholder
    selectCargo.innerHTML = '<option value="">Cargo</option>';

    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar cargos: ${response.statusText}`);
        }

        const cargos = await response.json();
        console.log('Cargos recebidos:', cargos);

        cargos.forEach(cargo => {
            const option = document.createElement('option');

            // aceita vários nomes possíveis vindos do backend
            option.value = cargo.cargosidcargo ?? cargo.cargosidcargo ?? cargo.cargosidcargo ?? cargo.cargosidcargo;
            option.textContent = cargo.nomecargo ?? cargo.nomecargo ?? cargo.nomecargo ?? cargo.nomecargo ?? 'Cargo';

            selectCargo.appendChild(option);
        });

    } catch (error) {
        console.error('Falha ao popular o menu de cargos:', error);
        const optionErro = document.createElement('option');
        optionErro.textContent = 'Erro ao carregar cargos';
        optionErro.disabled = true;
        selectCargo.appendChild(optionErro);
    }
}
