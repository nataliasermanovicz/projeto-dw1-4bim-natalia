

/*
 //cpf_pessoa, nome_pessoa, data_nascimento_pessoa,endereco_pessoa,senha_pessoa, email_pessoa
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

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = document.querySelectorAll('input, select,checkbox'); // Seleciona todos os inputs e selects do DOCUMENTO
    inputs.forEach((input, index) => {
        // console.log(`Input ${index}: ${input.name}, disabled: ${input.disabled}`);
        if (index === 0) {
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    document.getElementById('checkboxFuncionario').checked = false;
    document.getElementById('salario_funcionario').value = '';
    document.getElementById('cargo_id_cargo').value = '';
    document.getElementById('porcentagem_comissao_funcionario').value = '';


    document.getElementById('checkboxCliente').checked = false;
    document.getElementById('renda_cliente').value = '';
    document.getElementById('data_cadastro_cliente').value = '';

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
    return new Date(dataString).toISOString();
}

function converterDataParaFormatoYYYYMMDD(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') {
        return ''; // Retorna vazio se a entrada for nula ou não for string
    }

    // A maneira mais simples, já que o formato "yyyy-MM-dd" é apenas
    // a parte inicial da string ISO 8601 antes do 'T'.
    const partes = isoDateString.split('T');

    if (partes.length > 0) {
        return partes[0]; // Retorna a primeira parte, que é "yyyy-MM-dd"
    } else {
        // Trata o caso em que 'T' não está presente, embora seja improvável
        // para strings ISO 8601 completas.
        return '';
    }
}

async function funcaoEhFuncionario(pessoaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionario/${pessoaId}`);

        if (response.status === 404) {
         //   console.log('Não é funcionario');
            return { ehFuncionario: false };
        }

        if (response.status === 200) {
            const funcionarioData = await response.json();
            return {
                ehFuncionario: true,
                salario_funcionario: funcionarioData.salario_funcionario,
                cargo_id_cargo: funcionarioData.cargo_id_cargo,
                porcentagem_comissao_funcionario: funcionarioData.porcentagem_comissao_funcionario
            };
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na requisição:', errorData.error);
            return { ehFuncionario: false };
        }

    } catch (error) {
        console.error('Erro ao verificar se é funcionario:', error);
        return { ehFuncionario: false };
    }
}

async function funcaoEhCliente(pessoaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/${pessoaId}`);

        if (response.status === 404) {
         //   console.log('Não é cliente');
            return { ehCliente: false };
        }

        if (response.status === 200) {
            const clienteData = await response.json();
            return {
                ehCliente: true,
                renda_cliente: clienteData.renda_cliente,
                data_cadastro_cliente: clienteData.data_cadastro_cliente
            };
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na requisição:', errorData.error);
            return { ehCliente: false };
        }

    } catch (error) {
        console.error('Erro ao verificar se é cliente:', error);
        return { ehCliente: false };
    }
}




// Função para buscar pessoa por ID
async function buscarPessoa() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${id}`);

        if (response.ok) { //mostrar os dados da pessoa no formulário
            const pessoa = await response.json();
            preencherFormulario(pessoa);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pessoa encontrada!', 'success');

        } else if (response.status === 404) { //não encontrada essa pessoa
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }


}

// Função para preencher formulário com dados da pessoa, se for funcionario ou cliente, preencher também os dados respectivos.
async function preencherFormulario(pessoa) {
    currentPersonId = pessoa.cpf_pessoa;
    searchId.value = pessoa.cpf_pessoa;
    document.getElementById('nome_pessoa').value = pessoa.nome_pessoa || '';
    // Formatação da data para input type="date"
    //alert todos os dados da pessoa
    //alert('Dados da pessoa: ' + JSON.stringify(pessoa));

    if (pessoa.data_nascimento_pessoa) {
        const data = new Date(pessoa.data_nascimento_pessoa);
        const dataFormatada = converterDataParaFormatoYYYYMMDD(data.toISOString());
        document.getElementById('data_nascimento').value = dataFormatada;
    } else {
        document.getElementById('data_nascimento').value = '';
    }
    document.getElementById('endereco_pessoa').value = pessoa.endereco_pessoa || '';
    document.getElementById('senha_pessoa').value = pessoa.senha_pessoa || '';
    document.getElementById('email_pessoa').value = pessoa.email_pessoa || '';


    // Verifica se a pessoa é funcionario
    const ehFuncionarioEssaPessoa = await funcaoEhFuncionario(currentPersonId);

  //  console.log('Resultado função é funcionario:', ehFuncionarioEssaPessoa);

    if (ehFuncionarioEssaPessoa.ehFuncionario) {
        // alert('É funcionario: ' + oFuncionario.ehFuncionario + ' - ' + oFuncionario.salario + ' - ' + oFuncionario.departamento);
        document.getElementById('checkboxFuncionario').checked = true;
        document.getElementById('cargo_id_cargo').value = ehFuncionarioEssaPessoa.cargo_id_cargo;
        document.getElementById('salario_funcionario').value = ehFuncionarioEssaPessoa.salario_funcionario;
        document.getElementById('porcentagem_comissao_funcionario').value = ehFuncionarioEssaPessoa.porcentagem_comissao_funcionario;

    } else {
        // Não é funcionario
        document.getElementById('checkboxFuncionario').checked = false;
        document.getElementById('cargo_id_cargo').value = '';
        document.getElementById('salario_funcionario').value = '';
        document.getElementById('porcentagem_comissao_funcionario').value = '';
    }

    //Verifica se a pessoa é cliente
    const ehClienteEssaPessoa = await funcaoEhCliente(currentPersonId);
  //  console.log('Resultado função é cliente:', ehClienteEssaPessoa);
    if (ehClienteEssaPessoa.ehCliente) {
        // alert('É cliente: ' + oCliente.ehCliente + ' - ' + oCliente.renda + ' - ' + oCliente.data_cadastro);
        document.getElementById('checkboxCliente').checked = true;
        document.getElementById('renda_cliente').value = ehClienteEssaPessoa.renda_cliente;
        document.getElementById('data_cadastro_cliente').value = converterDataParaFormatoYYYYMMDD(ehClienteEssaPessoa.data_cadastro_cliente);

    } else {
        // Não é cliente
        document.getElementById('checkboxCliente').checked = false;
        document.getElementById('renda_cliente').value = '';
        document.getElementById('data_cadastro_cliente').value = '';
    }
}

// Função para incluir pessoa
async function incluirPessoa() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir nova pessoa - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_pessoa').focus();
    operacao = 'incluir';
    // console.log('fim nova pessoa - currentPersonId: ' + currentPersonId);
}

// Função para alterar pessoa
async function alterarPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_pessoa').focus();
    operacao = 'alterar';
}

// Função para excluir pessoa
async function excluirPessoa() {
    mostrarMensagem('Excluindo pessoa...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}


async function salvarOperacao() {
    // montar objeto pessoa com os nomes que o backend espera
    const formData = new FormData(form);
    const pessoa = {
        cpf_pessoa: searchId.value.trim(),
        nome_pessoa: formData.get('nome_pessoa'),
        // ajuste o nome do campo de data conforme seu backend: data_nascimento_pessoa ou data_nascimento
        data_nascimento_pessoa: converterDataParaISO(formData.get('data_nascimento')) || null,
        endereco_pessoa: formData.get('endereco_pessoa'),
        senha_pessoa: formData.get('senha_pessoa'),
        email_pessoa: formData.get('email_pessoa')
    };

    // capturar dados do funcionario só se checkbox marcado
    let funcionario = null;
    if (document.getElementById('checkboxFuncionario').checked) {
        funcionario = {
            pessoa_cpf_pessoa: pessoa.cpf_pessoa,
            salario_funcionario: document.getElementById('salario_funcionario').value,
            cargo_id_cargo: parseInt(document.getElementById('cargo_id_cargo').value),
            porcentagem_comissao_funcionario: document.getElementById('porcentagem_comissao_funcionario').value
        };
    }
    const caminhoFunc = `${API_BASE_URL}/funcionario/${currentPersonId}`;

    // capturar dados do cliente só se checkbox marcado
    let cliente = null;
    if (document.getElementById('checkboxCliente').checked) {
        cliente = {
            pessoa_cpf_pessoa: pessoa.cpf_pessoa,
            renda_cliente: document.getElementById('renda_cliente').value,
            data_cadastro_cliente: document.getElementById('data_cadastro_cliente').value || null
        };
    }
    const caminhoCliente = `${API_BASE_URL}/cliente/${currentPersonId}`;

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
                carregarPessoas();
                break;
            ///////////////////////////////////// alterar ///////////////////////////////////////
            case 'alterar':
               // console.log('Alterar pessoa - currentPersonId: ' + currentPersonId);
                // console.log('Dados pessoa:', pessoa);
                // console.log('Dados funcionario:', funcionario);
                // console.log('Dados cliente:', cliente);
                // alterar pessoa
                respPessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pessoa)
                });
                if (!respPessoa.ok) {
                    const err = await respPessoa.json().catch(() => ({ error: 'erro' }));
                    throw new Error('Erro ao alterar pessoa: ' + (err.error || respPessoa.status));
                }

                // tratar cliente: só inserir se NÃO existir; só deletar se EXISTIR

                //if checkboxCliente marcado -> cliente deve existir
                if (document.getElementById('checkboxCliente').checked) {
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
                } else { //checkbox não marcado
                    // não pode estar na tabela cliente, remover se existir
                    const respVerifCli = await fetch(caminhoCliente);
                   // console.log('Verificação cliente para possível exclusão, status:', respVerifCli.status);
                    // if (respVerifCli.status === 200) {
                    //     // existe, deletar
                    //     const respDel = await fetch(caminhoCliente, { method: 'DELETE' });
                    //     if (!respDel.ok) console.warn('Erro ao excluir cliente no alterar', respDel.status);
                    // }
                  
                    try {
                        const respCli = await fetch(caminhoCliente, {
                            method: 'DELETE'
                        });

                        // 1. Cliente excluído com sucesso (Resposta 204 No Content)
                        if (respCli.status === 204) {
                          
                            // Opcional: Recarregar a lista de clientes ou remover o item da UI
                            // Exemplo: recarregarListaClientes();
                        }

                        // 2. Erro: Cliente não encontrado (Resposta 404 Not Found)
                        if (respCli.status === 404) {
                            // O backend envia um JSON com { error: 'Cliente não encontrado' }
                            const data = await respCli.json();                           
                        }

                        // 3. Erro: Conflito de Foreign Key (Resposta 409 Conflict)
                        if (respCli.status === 409) {
                            // O backend envia um JSON com a mensagem de erro detalhada
                            const data = await respCli.json();
                            
                            alert(data.error);
                            document.getElementById('checkboxCliente').checked = true; // marcar novamente o checkbox
                            
                        }

                        // 4. Erro: Erro interno do servidor (Resposta 500 Internal Server Error)
                        if (respCli.status === 500) {
                            // O backend envia um JSON com { error: 'Erro interno do servidor...' }
                            const data = await respCli.json();
                          
                            alert(data.error);
                        }

                    } catch (error) {
                        // Erros de rede ou outros problemas antes de receber uma resposta do servidor
                        console.error('Erro de rede ao tentar deletar o cliente:', error);
                    }
                }


                // tratar funcionario de forma similar a cliente
                if (document.getElementById('checkboxFuncionario').checked) {
                    // funcionario deve existir: verificar se existe
                //    console.log('Verificando se funcionario existe para possível criação/alteração  ' + caminhoFunc);
                //    console.log('Dados funcionario para possível criação/alteração:', funcionario);

                    const respVerifFunc = await fetch(caminhoFunc);
                    if (respVerifFunc.status === 404) {
                        // não existe, criar
                        const respCriarFunc = await fetch(`${API_BASE_URL}/funcionario/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                        if (!respCriarFunc.ok) console.warn('Erro ao criar funcionario no alterar', respCriarFunc.status);
                    } else if (respVerifFunc.status === 200) {
                        // já existe, alterar
                        const respAlterarFunc = await fetch(caminhoFunc, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                        if (!respAlterarFunc.ok) console.warn('Erro ao alterar funcionario no alterar', respAlterarFunc.status);
                    } else {
                        console.warn('Erro ao verificar funcionario no alterar', respVerifFunc.status);
                    }
                } else { //checkbox não marcado
                    //excluir se existir na tabela funcionario
                    const respVerifFunc = await fetch(caminhoFunc);
                    if (respVerifFunc.status === 200) {
                        // existe, deletar
                        const respDel = await fetch(caminhoFunc, { method: 'DELETE' });
                        if (!respDel.ok) console.warn('Erro ao excluir funcionario no alterar', respDel.status);
                    }
                }

              //  console.log('Fim alterar pessoa - currentPersonId: ' + currentPersonId);


                mostrarMensagem('Pessoa alterada com sucesso!', 'success');
                limparFormulario();
                carregarPessoas();
                break;
            ///////////////////////////////////// excluir ///////////////////////////////////////
            case 'excluir':

                // excluir cliente se existir

                const respCli = await fetch(caminhoCliente);

                alert('Resposta ao obter cliente para possível exclusão: ' + respCli.status);

                if (respCli.status === 200) {
                    await fetch(caminhoCliente, { method: 'DELETE' });
                }

                // excluir funcionario se existir

                const respFuncObter = await fetch(caminhoFunc);
                if (respFuncObter.status === 200) {
                    await fetch(caminhoFunc, { method: 'DELETE' });
                }

                // excluir pessoa
                const respDelPessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, { method: 'DELETE' });
                if (!respDelPessoa.ok) {
                    const err = await respDelPessoa.json().catch(() => ({ error: 'erro' }));
                    throw new Error('Erro ao excluir pessoa: ' + (err.error || respDelPessoa.status));
                }

                mostrarMensagem('Pessoa excluída com sucesso!', 'success');
                limparFormulario();
                carregarPessoas();
                break;
        }

    } catch (error) {
        console.error('Erro salvarOperacao:', error);
        mostrarMensagem(error.message || 'Erro ao processar operação', 'error');
    } finally {
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        document.getElementById('searchId').focus();
    }
}



// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
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
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarPessoa(${pessoa.cpf_pessoa})">
                            ${pessoa.cpf_pessoa}
                        </button>
                    </td>
                    <td>${pessoa.nome_pessoa}</td>
                    <td>${formatarData(pessoa.data_nascimento_pessoa)}</td>                 
                    <td>${pessoa.endereco_pessoa}</td>
                    <td>${pessoa.senha_pessoa}</td>
                    <td>${pessoa.email_pessoa}</td>
                `;
        pessoasTableBody.appendChild(row);
    });
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
}

document.addEventListener('DOMContentLoaded', popularCargosSelect());

// Função que busca os cargos no backend e preenche o menu suspenso (select)
async function popularCargosSelect() {
    // 1. Encontrar o elemento <select>
    const selectCargo = document.getElementById('cargo_id_cargo');

    // Limpa as opções existentes (mantendo o "Selecione o Cargo" se for o caso)
    // selectCargo.innerHTML = '<option value="">Selecione o Cargo</option>';

    try {
        // 2. Fazer a requisição para o backend
        // Ajuste o endpoint (URL) de acordo com o que você configurou no seu router (ex: /api/cargos)
        const response = await fetch('/cargo'); 

        // 3. Verificar se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao buscar cargos: ${response.statusText}`);
        }

        // 4. Converter a resposta para JSON
        const cargos = await response.json();
        
        console.log('Cargos recebidos:', cargos); // Verifique no console se os dados chegaram

        // 5. Iterar sobre os cargos e adicionar as opções ao <select>
        cargos.forEach(cargo => {
            // Cria um novo elemento <option>
            const option = document.createElement('option');
            
            // Define o valor (que será o FK - id_cargo)
            option.value = cargo.id_cargo; 
            
            // Define o texto visível na lista (que será o nome_cargo)
            option.textContent = cargo.nome_cargo; 
            
            // Adiciona a opção ao select
            selectCargo.appendChild(option);
        });

    } catch (error) {
        console.error('Falha ao popular o menu de cargos:', error);
        // Opcional: Adicionar uma opção de erro ou mensagem para o usuário
        const optionErro = document.createElement('option');
        optionErro.textContent = 'Erro ao carregar cargos';
        optionErro.disabled = true;
        selectCargo.appendChild(optionErro);
    }
}