"use strict";
/* é uma diretiva do JavaScript que ativa o chamado modo estrito (strict mode).
Ela não é um comando, e sim uma instrução especial que muda o comportamento do interpretador 
JavaScript — tornando o código mais seguro, previsível e menos propenso a erros silenciosos.*/

/* lista de atributos e dados (exemplo) */
const atributosParaPesquisar = ['cpf', 'nome'];


//buscar dados no backend: rota http://localhost:3001/cliente
let dadosParaFiltrar = [];


const osClientes = fetch('http://localhost:3001/cliente');
osClientes.then(response => response.json())
    .then(data => {
     //   console.log("Dados dos clientes recebidos do backend:", data);
        // mapeia os dados para o formato esperado (com 'cpf' e 'nome')
        window.osClientes = data.map(item => ({
            cpf: item.pessoa_cpf_pessoa,
            nome: item.nome_pessoa
        }));
     //   console.log("Dados dos clientes mapeados:", window.osClientes);

        dadosParaFiltrar = window.osClientes ? window.osClientes : [];

       // console.log("dadosParaFiltrar atualizado:", dadosParaFiltrar);

    })
    .catch(error => {
        console.error("Erro ao buscar dados dos clientes:", error);
        window.osClientes = []; // garante que a variável exista mesmo em caso de erro
    });

// dados fixos para teste (serão substituídos pelos dados reais do backend)


console.log("dadosParaFiltrar:", dadosParaFiltrar);

/**
 * Cria a busca dinâmica: retorna um objeto com waitForSelection()
 * waitForSelection() retorna uma Promise que resolve quando o usuário clica num item
 * ou resolve com null caso o clique seja fora (cancelamento).
 */
function createBuscaDinamica({ searchTypeId = 'searchType', searchInputId = 'cliente_pessoa_cpf_pessoa', resultsListId = 'resultsList', atributosParaPesquisar, dadosParaFiltrar }) {
    const searchTypeElement = document.getElementById(searchTypeId);
    const searchInputElement = document.getElementById(searchInputId);
    const resultsList = document.getElementById(resultsListId);

    let currentResolve = null;

    function hideList() {
        resultsList.classList.remove('show');
        resultsList.innerHTML = '';
    }

    function renderList(filtered) {
        resultsList.innerHTML = '';
        if (!filtered.length) {
            hideList();
            return;
        }

        filtered.forEach(dado => {
            const li = document.createElement('li');
            li.className = 'result-item';
            li.innerHTML = `<span class="result-main">${dado.nome}</span><span class="result-type">(${dado.cpf})</span>`;

            li.addEventListener('click', () => {
                const resp = {};
                atributosParaPesquisar.forEach(attr => { resp[attr] = dado[attr]; });

                hideList();
                // limpa o campo para ficar pronto para próxima busca (comportamento original)
                searchInputElement.value = '';
                searchInputElement.blur();

                if (currentResolve) {
                    currentResolve(resp);
                    currentResolve = null;
                }
            });

            resultsList.appendChild(li);
        });

        resultsList.classList.add('show');
    }

    function filterBase() {
        const query = searchInputElement.value.trim().toLowerCase();
        const type = searchTypeElement.value;
        if (query.length === 0) {
            hideList();
            return;
        }

        const filtered = dadosParaFiltrar.filter(dado => {
            const valor = String(dado[type] || '').toLowerCase();
            return valor.includes(query);
        });

        renderList(filtered);
    }

    // Eventos (adicionados uma única vez)
    searchInputElement.addEventListener('input', filterBase);
    searchInputElement.addEventListener('focus', filterBase);

    // fechar quando clicar fora e, se houver uma Promise pendente, resolver com null (cancelado)
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-bar-container')) {
            if (currentResolve) {
                currentResolve(null); // indica cancelamento
                currentResolve = null;
            }
            hideList();
        }
    });

    return {
        waitForSelection() {
            return new Promise(resolve => {
                currentResolve = resolve;
            });
        }
    };
}

/* inicializa após DOM pronto */
// document.addEventListener('DOMContentLoaded', () => {
//     window.bdBusca = createBuscaDinamica({ atributosParaPesquisar, dadosParaFiltrar });
// });

/* função chamada pelo onfocus do input — aguarda a seleção */
async function buscaDinamica() {
    // evita erro caso não tenha sido inicializado (defensivo)
    console.log("buscaDinamica chamada...");
    // debugger;   
    window.bdBusca = createBuscaDinamica({ atributosParaPesquisar, dadosParaFiltrar });

    if (!window.bdBusca) {
        console.error("Erro: bdBusca não inicializado.");
        return;
    }

    const resposta = await window.bdBusca.waitForSelection();

    // Se o usuário cancelou (clicou fora), resposta será null
    if (!resposta) {
        console.log('Busca cancelada ou sem seleção.');
        return;
    }

    // exemplo de uso do retorno:
    console.log("resposta em formato JSON =>", JSON.stringify(resposta));
    // document.getElementById('searchInput').value = resposta.cpf || '';
    console.log("Preenchendo campo com CPF:", resposta.cpf);
    document.getElementById('cliente_pessoa_cpf_pessoa').value = resposta.cpf || '';
    // deixa o tipo como CPF (se esse for o seu objetivo)
    document.getElementById('searchType').value = 'cpf';
}
