
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
    // carregarPedidos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
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
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
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

// Função para buscar pedido por ID
async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        //console.log('Response status:', response.status);
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');

            // Fazer a requisição dos itens separadamente e carregar na tabela
            await carregarItensDoPedido(pedido.id_pedido);

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
        // debugger;
        const responseItens = await fetch(`${API_BASE_URL}/pedido_has_produto/${pedidoId}`);

        if (responseItens.ok) {
            const itensDoPedido = await responseItens.json();
            renderizerTabelaItensPedido(itensDoPedido || []);
        } else if (responseItens.status === 404) {
            // Silencia completamente o 404 - sem console.log
            const itensTableBody = document.getElementById('itensTableBody');
            itensTableBody.innerHTML = '';
        }
        // Ignora outros status silenciosamente
    } catch (error) {
        // Ignora erros de rede silenciosamente para itens
    }
}

function formatarDataParaInputDate(data) {
    const dataObj = new Date(data); // Converte a data para um objeto Date
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses começam do zero, então +1
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
    return `${ano}-${mes}-${dia}`; // Retorna a data no formato yyyy-mm-dd
}

// Função para preencher formulário com dados da pedido
function preencherFormulario(pedido) {
    //  console.log(JSON.stringify(pedido));
    //  console.log('data pedido: ' + pedido.data_pedido);
    //  console.log('data pedido formatar: ' + formatarDataParaInputDate(pedido.data_pedido));

    currentPersonId = pedido.id_pedido;
    searchId.value = pedido.id_pedido;
    document.getElementById('data_pedido').value = formatarDataParaInputDate(pedido.data_pedido);

    document.getElementById('cliente_pessoa_cpf_pessoa').value = pedido.cliente_pessoa_cpf_pessoa || 0;
    document.getElementById('funcionario_pessoa_cpf_pessoa').value = pedido.funcionario_pessoa_cpf_pessoa || 0;
}


// Função para incluir pedido
async function incluirPedido() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir novo pedido - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_pedido').focus();
    operacao = 'incluir';
    // console.log('fim nova pedido - currentPersonId: ' + currentPersonId);
}

// Função para alterar pedido
async function alterarPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_pedido').focus();
    operacao = 'alterar';
}

// Função para excluir pedido
async function excluirPedido() {
    mostrarMensagem('Excluindo pedido...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const pedido = {
        id_pedido: searchId.value,
        data_pedido: formData.get('data_pedido'),
        cliente_pessoa_cpf_pessoa: formData.get('cliente_pessoa_cpf_pessoa'),
        funcionario_pessoa_cpf_pessoa: formData.get('funcionario_pessoa_cpf_pessoa'),
    };

    console.log(pedido)

    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
             renderizerTabelaItensPedido([]);
        } else if (operacao === 'excluir') {
            // console.log('Excluindo pedido com ID:', currentPersonId);
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'DELETE'
            });
            console.log('Pedido excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaPedido = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            //  carregarPedidos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir pedido', 'error');
        } else {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            limparFormulario();
            //  carregarPedidos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a pedido', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

function renderizerTabelaItensPedido(itens) {
    const itensTableBody = document.getElementById('itensTableBody');
    itensTableBody.innerHTML = '';

    // Check if itens is a single object and wrap it in an array
    if (typeof itens === 'object' && !Array.isArray(itens)) {
        itens = [itens]; // Wrap the object in an array        
    }

    // Iterate over the array and render rows
    itens.forEach((item, index) => {
        const row = document.createElement('tr');
        let subTotal = item.quantidade * item.preco_unitario;
        subTotal = subTotal.toFixed(2).replace('.', ',');

        row.innerHTML = `
            <td>${item.pedido_id_pedido}</td>                  
            <td>${item.produto_id_produto}</td>
            <td>${item.nome_produto}</td>
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

    // Adicionar event listeners para atualizar o subtotal
    adicionarEventListenersSubtotal();
}

function adicionarEventListenersSubtotal() {
    const quantidadeInputs = document.querySelectorAll('.quantidade-input');
    const precoInputs = document.querySelectorAll('.preco-input');

    // Adicionar event listeners para os inputs de quantidade
    quantidadeInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });

    // Adicionar event listeners para os inputs de preço
    precoInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });
}

function atualizarSubtotal(event) {
    const index = event.target.getAttribute('data-index');
    const row = event.target.closest('tr');

    const quantidadeInput = row.querySelector('.quantidade-input');
    const precoInput = row.querySelector('.preco-input');
    const subtotalCell = row.querySelector('.subtotal-cell');

    // Obter valores atuais (usando parseFloat e fallback para 0 se for inválido)
    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const preco = parseFloat(precoInput.value) || 0;

    // Calcular novo subtotal
    const novoSubtotal = quantidade * preco;

    // Atualizar a célula do subtotal
    subtotalCell.textContent = novoSubtotal.toFixed(2).replace('.', ',');   

}


// Função para carregar lista de pedidos
async function carregarPedidos() {
    try {
        const rota = `${API_BASE_URL}/pedido`;
        // console.log("a rota " + rota);


        const response = await fetch(rota);
        //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const pedidos = await response.json();

            // Fetch itens do pedido for the first pedido
            if (pedidos.length > 0) {
                renderizarTabelaPedidos(pedidos);
            } else {
                throw new Error('Erro ao carregar itens do pedido');
            }
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


// Função para adicionar uma nova linha vazia para um item na tabela de itens do pedido.
function adicionarItem() {
    const itensTableBody = document.getElementById('itensTableBody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="number" class="pedido-id-input" value="${searchId.value}" disabled>
        </td>                  
        <td class="produto-group">
            <input type="number" class="produto-id-input">
            <button class="btn-secondary btn-small" onclick="buscarProdutoPorId(this)">Buscar</button>
        </td>
        <td>
            <span class="produto-nome-input" id="produto-nome-input" >xx</span>
        </td>
        <td>
            <input type="number" class="quantidade-input" value="1" min="1">
        </td>
        <td>
            <input type="number" class="preco-input" value="0.00" min="0" step="0.01">
        </td>                               
        <td class="subtotal-cell">0,00</td>  
        <td>
            <button class="btn-secondary btn-small" onclick="btnAdicionarItem(this)">Adicionar</button>
        </td> 
          <td>
            <button class="btn-secondary btn-small" onclick="btnCancelarItem(this)">Cancelar</button>
        </td> 
               
    `;
    itensTableBody.appendChild(row);

    adicionarEventListenersSubtotal();
}


// Função para buscar o produto por ID no banco de dados. vai preencher o nome e o preço unitário
async function buscarProdutoPorId(button) {
    const row = button.closest('tr');
    const produtoIdInput = row.querySelector('.produto-id-input');
    const produtoId = produtoIdInput.value;

    if (!produtoId) {
        mostrarMensagem('Por favor, insira um ID de produto.', 'warning');
        return;
    }

    try {
        //const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        const response = await fetch(`${API_BASE_URL}/produto/${produtoId}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }

        const produto = await response.json();

        // Preenche os campos da linha com os dados do produto


        const precoInput = row.querySelector('.preco-input');
        precoInput.value = produto.preco_unitario;

        const nome_produtoInput = row.querySelector('td:nth-child(3) span');
        nome_produtoInput.innerHTML = produto.nome_produto;

        // Atualiza o subtotal da linha
        atualizarSubtotal({ target: precoInput });

        mostrarMensagem(`Produto ${produto.nome_produto} encontrado!`, 'success');

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        mostrarMensagem(error.message, 'error');
    }
}


// Função para coletar os dados de uma nova linha e enviar ao servidor para criação.
function btnAdicionarItem(button) {
    // Encontra a linha (<tr>) pai do botão.
    const row = button.closest('tr');
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // Coleta os dados dos inputs da linha.
    const pedidoId = row.querySelector('.pedido-id-input').value;
    const produtoId = row.querySelector('.produto-id-input').value;
    const quantidade = row.querySelector('.quantidade-input').value;
    const precoUnitario = row.querySelector('.preco-input').value;

    // Converte os valores para os tipos corretos.
    const itemData = {
        pedido_id_pedido: parseInt(pedidoId),
        produto_id_produto: parseInt(produtoId),
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    // Valida os dados antes do envio.
    if (isNaN(itemData.pedido_id_pedido) || isNaN(itemData.produto_id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    // Envia os dados para a API usando fetch.
    fetch(`${API_BASE_URL}/pedido_has_produto`, {
        method: 'POST', // Método para criar um novo recurso.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar o item do pedido. Verifique os IDs e tente novamente.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item adicionado com sucesso!', 'success');
            
            // atualizar a interface para refletir o sucesso, 
              buscarPedido();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
        
}

// Função para cancelar a adição de um novo item, removendo a linha da tabela.
function btnCancelarItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    // 2. Verifica se a linha foi encontrada e a remove.
    if (row) {
        row.remove();
        mostrarMensagem('Adição do item cancelada.', 'info');
    } else {
        console.error("Erro: Não foi possível encontrar a linha da tabela para cancelar.");
    }
}

function btnAtualizarItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    // O 'closest' é um método muito útil para encontrar o ancestral mais próximo com o seletor especificado.
    const row = button.closest('tr');

    // Se a linha não for encontrada, algo está errado, então saímos da função.
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // 2. Pega todas as células (<td>) da linha.   
    const cells = Array.from(row.cells);

    // 3. Extrai os dados de cada célula da linha.
    // Como sua tabela tem uma estrutura fixa, podemos usar os índices para pegar os dados.
    // Lembre-se que os índices de arrays começam em 0.
    const pedidoId = cells[0].textContent;
    const produtoId = cells[1].textContent;
    const nomeProduto = cells[2].textContent;
    const quantidade = cells[3].querySelector('input').value;
    const precoUnitario = cells[4].querySelector('input').value;


    // 4. Converte os valores para os tipos de dados corretos, se necessário.
    const itemData = {
        pedido_id_pedido: parseInt(pedidoId),
        produto_id_produto: parseInt(produtoId),
        nome_produto: nomeProduto.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " "), // Sanitiza e remove quebras de linha  
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    //  alert("Dados do item a serem salvos:" + JSON.stringify(itemData));

    // 5. Valida os dados antes de enviar (opcional, mas recomendado).
    if (isNaN(itemData.pedido_id_pedido) || isNaN(itemData.produto_id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    // remover o nome do produto do envio, pois é desnecessário
    delete itemData.nome_produto;

    //alert("Dados do item a serem salvos:" + JSON.stringify(itemData));

    // 6. Envia os dados para o backend usando fetch.
    // Ajuste a URL e o método conforme sua API. router.put('/:id_pedido/:id_produto', pedido_has_produtoController.atualizarPedido_has_produto);
    // Note que estamos enviando tanto o id do pedido quanto o id do produto na URL.
    fetch(`${API_BASE_URL}/pedido_has_produto/${itemData.pedido_id_pedido}/${itemData.produto_id_produto}`, {
        method: 'PUT', // para atualizar
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar o item do pedido.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item salvo com sucesso!', 'success');
            // Aqui você pode atualizar a UI, limpar campos, etc.
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });


}

function btnExcluirItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // 2. Extrai os IDs do pedido e do produto da linha, que compõem a chave primária.
    const pedidoId = row.cells[0].textContent;
    const produtoId = row.cells[1].textContent;

    // 3. Valida os dados antes de enviar.
    if (isNaN(parseInt(pedidoId)) || isNaN(parseInt(produtoId))) {
        mostrarMensagem('IDs do pedido ou produto inválidos.', 'warning');
        return;
    }

    // 4. Pergunta ao usuário para confirmar a exclusão.
    // Isso evita exclusões acidentais.
    if (!confirm(`Tem certeza que deseja excluir o item do produto ${produtoId} do pedido ${pedidoId}?`)) {
        return; // Sai da função se o usuário cancelar
    }

    // 5. Envia a requisição DELETE para a API.
    // A rota DELETE espera os IDs na URL para identificar o item.
    fetch(`${API_BASE_URL}/pedido_has_produto/${pedidoId}/${produtoId}`, {
        method: 'DELETE', // O método HTTP para exclusão
    })
        .then(response => {
            if (response.ok) { // A requisição foi bem-sucedida (status 204)
                // 6. Se a exclusão no backend foi bem-sucedida, remove a linha da tabela na interface.
                row.remove();
                mostrarMensagem('Item excluído com sucesso!', 'success');
            } else if (response.status === 404) {
                // Se o item não for encontrado, informa o usuário.
                mostrarMensagem('Erro: Item não encontrado no servidor.', 'error');
            } else {
                // Para outros erros, lança uma exceção.
                throw new Error('Erro ao excluir o item do pedido.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}