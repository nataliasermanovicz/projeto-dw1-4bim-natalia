const HOST_BACKEND = 'http://localhost:3001';

// Função auxiliar para buscar propriedades ignorando maiúsculas/minúsculas e underlines
// Adicionamos 'fkpedido' e 'fk_pedido' como termos de busca comuns em relações.
function getProp(obj, terms) {
    if (!obj) return undefined;
    const keys = Object.keys(obj);
    
    // 1. Tenta match exato
    for (let t of terms) {
        if (obj[t] !== undefined) return obj[t];
    }
    
    // 2. Tenta match ignorando case e underlines
    for (let key of keys) {
        const keyLower = key.toLowerCase().replace(/_/g, '');
        for (let t of terms) {
            const termLower = t.toLowerCase().replace(/_/g, '');
            if (keyLower === termLower) return obj[key];
        }
    }
    return undefined;
}

async function carregarPedidosUsuario() {
    const listaEl = document.getElementById('registro-pedidos-lista');
    
    // ⚠️ MELHORIA DE CONSISTÊNCIA: Apenas um local para obter o ID do cliente.
    // Prioriza 'cpfUsuarioLogado' para consistência, mas aceita 'clienteIdPessoa'
    const clienteId = localStorage.getItem('cpfUsuarioLogado') || localStorage.getItem('clienteIdPessoa');

    if (!clienteId) {
        listaEl.innerHTML = '<p class="loading-msg">Você precisa estar logado para ver seus pedidos. <a href="/login">Faça login</a>.</p>';
        return;
    }

    try {
        console.log(`Buscando dados para o cliente CPF/ID: ${clienteId}...`);
        
        // Timestamp para evitar Cache do navegador
        const timestamp = new Date().getTime();

        // Fazendo todas as requisições em paralelo
        const [resPedidos, resPagamentos, resRelacaoPg, resFormasPg, resItensPedido, resProdutos] = await Promise.all([
            fetch(`${HOST_BACKEND}/pedido/cliente/${clienteId}?t=${timestamp}`), 
            fetch(`${HOST_BACKEND}/pagamento?t=${timestamp}`).catch(() => ({ ok: false })),
            fetch(`${HOST_BACKEND}/pagamento_forma?t=${timestamp}`).catch(() => ({ ok: false })), 
            fetch(`${HOST_BACKEND}/forma_pagamento?t=${timestamp}`).catch(() => ({ ok: false })),
            fetch(`${HOST_BACKEND}/pedido_produto?t=${timestamp}`).catch(() => ({ ok: false })), 
            fetch(`${HOST_BACKEND}/produto?t=${timestamp}`).catch(() => ({ ok: false }))
        ]);

        if (!resPedidos.ok) {
            if(resPedidos.status === 404 || resPedidos.status === 204) { // Adicionado 204 (No Content)
                listaEl.innerHTML = '<p class="loading-msg">Nenhum pedido encontrado para este usuário.</p>';
                return;
            }
            listaEl.innerHTML = '<p class="loading-msg">Erro ao carregar pedidos. Tente novamente mais tarde.</p>';
            return;
        }

        // Converter Respostas para JSON
        const pedidos = await resPedidos.json();
        // Garante que mesmo se a requisição retornar um objeto vazio, tenhamos um array
        const pagamentos = resPagamentos.ok ? await resPagamentos.json() : [];
        const relacaoPg = resRelacaoPg.ok ? await resRelacaoPg.json() : [];
        const formasPg = resFormasPg.ok ? await resFormasPg.json() : [];
        const todosItensPedido = resItensPedido.ok ? await resItensPedido.json() : [];
        const catalogoProdutos = resProdutos.ok ? await resProdutos.json() : [];

        // Verifica se a resposta de pedidos é um array e se não está vazio
        const meusPedidos = Array.isArray(pedidos) ? pedidos : []; 

        if (meusPedidos.length === 0) {
            listaEl.innerHTML = '<p class="loading-msg">Você ainda não realizou nenhum pedido.</p>';
            return;
        }

        const container = document.createElement('div');

        // Ordena do mais recente para o mais antigo
        meusPedidos.sort((a, b) => {
            const idA = getProp(a, ['idpedido', 'idPedido', 'id']);
            const idB = getProp(b, ['idpedido', 'idPedido', 'id']);
            return (idB || 0) - (idA || 0);
        });

        meusPedidos.forEach(pedido => {
            // Normalização de Dados do Pedido
            const idPedido = getProp(pedido, ['idpedido', 'idPedido', 'id']);
            const dataRaw = getProp(pedido, ['datadopedido', 'dataDoPedido', 'createdAt', 'data']);
            
            if (!idPedido) {
                console.warn("Pedido sem ID encontrado, ignorando:", pedido);
                return; // Pula este pedido se o ID for inválido
            }
            
            // --- Lógica de Produtos (Itens) ---
            const itensDestePedido = todosItensPedido.filter(item => {
                // CORREÇÃO: Adicionando mais termos de busca para garantir a FK do Pedido
                const fkPedido = getProp(item, ['pedidoidpedido', 'PedidoIdPedido', 'pedido_id', 'id_pedido', 'pedidoid', 'fkpedido', 'fk_pedido']);
                return String(fkPedido) === String(idPedido);
            });

            let htmlItens = '';
            let somaValorItens = 0;

            if (itensDestePedido.length > 0) {
                htmlItens = `<div class="itens-container"><div class="titulo-itens">Itens Comprados</div>`;
                
                itensDestePedido.forEach(itemRelacao => {
                    const idProd = getProp(itemRelacao, ['produtoidproduto', 'ProdutoIdProduto', 'produto_id', 'id_produto', 'produtoid']);
                    const qtd = Number(getProp(itemRelacao, ['quantidade', 'qtd', 'amount']) || 1);
                    const precoUnitario = Number(getProp(itemRelacao, ['precounitario', 'precoUnitario', 'preco', 'valor']) || 0);
                    
                    // Busca detalhes no catálogo
                    const produtoDetalhes = catalogoProdutos.find(p => {
                        const pId = getProp(p, ['idproduto', 'idProduto', 'id']);
                        return String(pId) === String(idProd);
                    });

                    const nomeProduto = produtoDetalhes ? getProp(produtoDetalhes, ['nomeproduto', 'nomeProduto', 'nome']) : `Produto #${idProd} (Detalhe Indisponível)`;
                    
                    // Se o preço não veio na relação, tenta pegar do cadastro do produto
                    const precoFinal = precoUnitario > 0 ? precoUnitario : (produtoDetalhes ? Number(getProp(produtoDetalhes, ['preco', 'price']) || 0) : 0);

                    somaValorItens += (precoFinal * qtd);

                    htmlItens += `
                        <div class="item-row">
                            <span class="item-qtd">${qtd}x</span>
                            <span class="item-nome">${nomeProduto}</span>
                            <span class="item-preco">${(precoFinal * qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    `;
                });
                htmlItens += `</div>`;
            } else {
                // Caso não ache itens, mostra mensagem discreta
                console.log(`Aviso: Nenhum item encontrado para o Pedido ID ${idPedido}. Verifique a tabela pedido_produto.`);
                htmlItens = `<div class="itens-container" style="color:#777; font-style:italic; padding:10px; border-top:1px solid #eee;">
                    Detalhes dos itens indisponíveis no momento. (ID: ${idPedido})
                </div>`;
            }

            // --- Lógica de Pagamento ---
            const pgDoPedido = pagamentos.find(pg => {
                const pgFk = getProp(pg, ['pedidoidpedido', 'PedidoIdPedido', 'pedido_id', 'id_pedido', 'fkpedido']);
                return String(pgFk) === String(idPedido);
            });
            
            let valorTotalFinal = 0;
            let dataPagamentoRaw = null;
            let nomeFormaPagamento = "Processando"; 
            let statusClass = "badge-pendente";

            if (pgDoPedido) {
                const valorPg = Number(getProp(pgDoPedido, ['valortotalpagamento', 'valorTotalPagamento', 'valor']) || 0);
                
                // Usa o valor do pagamento se for > 0, senão usa a soma dos itens
                valorTotalFinal = valorPg > 0 ? valorPg : somaValorItens; 
                
                dataPagamentoRaw = getProp(pgDoPedido, ['datapagamento', 'dataPagamento', 'data']);
                statusClass = "badge-pagamento";
                nomeFormaPagamento = "Pago";

                // Cruzar Pagamento -> Forma
                const idPagamento = getProp(pgDoPedido, ['idpagamento', 'idPagamento', 'id']);
                
                const relacao = relacaoPg.find(r => {
                    const rFk = getProp(r, ['pagamentoidpedido', 'PagamentoIdPedido', 'pagamento_id', 'pagamentoid']); 
                    return String(rFk) === String(idPagamento);
                });

                if (relacao) {
                    const idForma = getProp(relacao, ['formapagamentoidformapagamento', 'FormaPagamentoIdFormaPagamento', 'forma_id', 'formaid']);
                    const formaObj = formasPg.find(f => {
                        const fId = getProp(f, ['idformapagamento', 'idFormaPagamento', 'id']);
                        return String(fId) === String(idForma);
                    });
                    if (formaObj) nomeFormaPagamento = getProp(formaObj, ['nomeformapagamento', 'nomeFormaPagamento', 'nome']) || "Pago";
                }
            } else {
                valorTotalFinal = somaValorItens;
                nomeFormaPagamento = "Aguardando pgto";
            }

            // --- Renderização do Card ---
            const dataObj = dataRaw ? new Date(dataRaw) : new Date();
            const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            const valorFormatado = valorTotalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const card = document.createElement('div');
            card.className = 'pedido-card';
            
            card.innerHTML = `
                <div class="pedido-header">
                    <span class="pedido-id">Pedido #${idPedido}</span>
                    <span class="pedido-data">📅 ${dataFormatada}</span>
                </div>
                
                <div class="pedido-body">
                    <div class="info-linha">
                        <span class="label">Status:</span>
                        <span class="valor">${dataPagamentoRaw ? '<span style="color:green; font-weight:bold;">Confirmado</span>' : '<span style="color:#d9534f; font-weight:bold;">Pendente</span>'}</span>
                    </div>
                    ${htmlItens}
                </div>

                <div class="pedido-footer">
                    <div class="metodo-pg">
                        <span class="${statusClass}">
                            ${statusClass === 'badge-pagamento' ? '✔' : '⏳'} ${nomeFormaPagamento}
                        </span>
                    </div>
                    <div class="total-container">
                        <span class="total-label">Total</span>
                        <span class="total-valor">${valorFormatado}</span>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        listaEl.innerHTML = '';
        listaEl.appendChild(container);

    } catch (error) {
        console.error('Erro fatal ao carregar pedidos:', error);
        listaEl.innerHTML = '<p class="loading-msg">Erro de conexão ou processamento. Verifique o console para mais detalhes.</p>';
    }
}

// Inicialização e Lógica de Usuário
window.addEventListener('DOMContentLoaded', () => {
    carregarPedidosUsuario();
});

function logout() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('perfilUsuario');
    localStorage.removeItem('usuarioEmail');
    localStorage.removeItem('clienteIdPessoa');
    localStorage.removeItem('cpfUsuarioLogado'); 
    localStorage.removeItem('ehGerente');
    localStorage.removeItem('carrinho');
    
    irParaMenu();
}

// Expõe a função para ser usada no onclick do HTML
window.logout = logout;
