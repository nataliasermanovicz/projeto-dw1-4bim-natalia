const HOST_BACKEND = 'http://localhost:3001';

// Função utilitária para buscar propriedades de forma segura
function getProp(obj, terms) {
    if (!obj) return undefined;
    
    // 1. Tenta encontrar a propriedade exata fornecida na lista 'terms'
    for (let t of terms) {
        if (obj[t] !== undefined) return obj[t];
    }
    
    // 2. Fallback: Procura ignorando case
    const keys = Object.keys(obj);
    for (let key of keys) {
        const keyLower = key.toLowerCase();
        for (let t of terms) {
            if (keyLower === t.toLowerCase()) return obj[key];
        }
    }
    return undefined;
}

async function carregarPedidosUsuario() {
    const listaEl = document.getElementById('pedidos-lista');
    
    // Recupera o CPF salvo no Login
    const clienteId = localStorage.getItem('cpfUsuarioLogado') || localStorage.getItem('clienteIdPessoa');

    if (!clienteId) {
        listaEl.innerHTML = '<div class="aviso-centro">Você precisa estar logado para ver seus pedidos. <br><a href="/login" class="btn-login-link">Fazer Login</a></div>';
        return;
    }

    try {
        console.log(`Buscando pedidos para o CPF: ${clienteId}...`);
        
        const timestamp = new Date().getTime();

        // Fazendo as requisições
        const [resPedidos, resItensPedido, resProdutos] = await Promise.all([
            // 1. Pedidos do cliente (Agora traz JOIN com Pagamento: id_pedido, nome_pagamento...)
            fetch(`${HOST_BACKEND}/pedido/cliente/${clienteId}?t=${timestamp}`), 
            
            // 2. Itens do Pedido
            fetch(`${HOST_BACKEND}/pedidohasproduto?t=${timestamp}`).catch(() => ({ ok: false })), 
            
            // 3. Catálogo de Produtos
            fetch(`${HOST_BACKEND}/produto?t=${timestamp}`).catch(() => ({ ok: false }))
        ]);

        if (!resPedidos.ok) {
            if(resPedidos.status === 404 || resPedidos.status === 204) {
                listaEl.innerHTML = '<div class="aviso-centro">Nenhum pedido encontrado para este usuário.</div>';
                return;
            }
            throw new Error(`Erro ao buscar pedidos: ${resPedidos.status}`);
        }

        const pedidos = await resPedidos.json();
        const todosItensPedido = resItensPedido.ok ? await resItensPedido.json() : [];
        const catalogoProdutos = resProdutos.ok ? await resProdutos.json() : [];

        const meusPedidos = Array.isArray(pedidos) ? pedidos : []; 

        if (meusPedidos.length === 0) {
            listaEl.innerHTML = '<div class="aviso-centro">Você ainda não realizou nenhum pedido.</div>';
            return;
        }

        const container = document.createElement('div');

        // Ordena: Mais recente primeiro
        meusPedidos.sort((a, b) => {
            const idA = getProp(a, ['id_pedido', 'idpedido']);
            const idB = getProp(b, ['id_pedido', 'idpedido']);
            return Number(idB) - Number(idA);
        });

        meusPedidos.forEach(pedido => {
            // ============================================================
            // 1. DADOS DO PEDIDO
            // ============================================================
            const idPedido = getProp(pedido, ['id_pedido', 'idpedido']);
            const dataRaw = getProp(pedido, ['data_pedido', 'datadopedido']);
            
            if (!idPedido) return; 

            // ============================================================
            // 2. FILTRAR ITENS
            // ============================================================
            const itensDestePedido = todosItensPedido.filter(item => {
                const fkPedido = getProp(item, ['pedidoidpedido', 'pedido_id']); 
                return String(fkPedido) === String(idPedido);
            });

            let htmlItens = '';
            let somaValorItens = 0;

            if (itensDestePedido.length > 0) {
                htmlItens = `<div class="itens-container"><div class="titulo-itens">Itens Comprados</div>`;
                
                itensDestePedido.forEach(itemRelacao => {
                    const idProd = getProp(itemRelacao, ['produtoidproduto']);
                    const qtd = Number(getProp(itemRelacao, ['quantidade']) || 1);
                    const precoUnitario = Number(getProp(itemRelacao, ['precounitario']) || 0);

                    const produtoDetalhes = catalogoProdutos.find(p => {
                        const pId = getProp(p, ['idproduto']);
                        return String(pId) === String(idProd);
                    });

                    const nomeProduto = produtoDetalhes ? getProp(produtoDetalhes, ['nomeproduto']) : `Produto #${idProd}`;
                    
                    const subtotal = precoUnitario * qtd;
                    somaValorItens += subtotal;

                    htmlItens += `
                        <div class="item-row">
                            <span class="item-qtd">${qtd}x</span>
                            <span class="item-nome">${nomeProduto}</span>
                            <span class="item-preco">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    `;
                });
                htmlItens += `</div>`;
            } else {
                htmlItens = `<div class="sem-itens">Nenhum item encontrado para este pedido.</div>`;
            }

            // ============================================================
            // 3. PAGAMENTO E FORMA DE PAGAMENTO (NOVO!)
            // Tenta pegar o nome vindo do banco (Ex: "Cartão", "PIX")
            // ============================================================
            
            // Busca 'nome_pagamento' (do alias no controller) ou 'nomeformapagamento' (do banco)
            const nomePagamentoBanco = getProp(pedido, ['nome_pagamento', 'nomeformapagamento']);
            
            // Busca 'valor_total' (do alias) ou 'valortotalpagamento' (do banco)
            const valorPagamentoBanco = Number(getProp(pedido, ['valor_total', 'valortotalpagamento']));

            let valorTotalFinal = somaValorItens;
            let formaNome = "Processando...";
            let estiloBadge = "background-color: #f0ad4e; color: white;"; // Laranja (Pendente)

            // Lógica de exibição do status
            if (nomePagamentoBanco) {
                // Se veio do banco, está confirmado
                formaNome = nomePagamentoBanco; 
                estiloBadge = "background-color: #28a745; color: white;"; // Verde (Sucesso)
                
                // Se temos o valor exato do pagamento no banco, usamos ele (é mais confiável que a soma)
                if (valorPagamentoBanco > 0) {
                    valorTotalFinal = valorPagamentoBanco;
                }
            } else {
                // Fallback para pedidos antigos ou sem pagamento registrado
                formaNome = "Pendente / Não Inf.";
                estiloBadge = "background-color: #6c757d; color: white;"; // Cinza
            }

            // ============================================================
            // 4. DATA E RENDERIZAÇÃO
            // ============================================================
            let dataFormatada = "--/--/----";
            if (dataRaw) {
                const dataString = String(dataRaw).split('T')[0]; 
                const partes = dataString.split('-'); 
                if (partes.length === 3) {
                    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            const card = document.createElement('div');
            card.className = 'pedido-card';
            card.innerHTML = `
                <div class="pedido-header">
                    <span class="pedido-id">Pedido #${idPedido}</span>
                    <span class="pedido-data">📅 ${dataFormatada}</span>
                </div>
                
                <div class="pedido-body">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                        <span class="label" style="font-weight:bold; color:#555;">Pagamento:</span>
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; ${estiloBadge}">
                            ${formaNome}
                        </span>
                    </div>
                    
                    ${htmlItens}

                    <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span class="total-label" style="font-size: 1.1rem; font-weight: bold; color: #8B1E3F;">Total Final</span>
                        <span class="total-valor" style="font-size: 1.2rem; font-weight: bold; color: #333;">
                            ${valorTotalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        listaEl.innerHTML = '';
        listaEl.appendChild(container);

    } catch (error) {
        console.error('Erro:', error);
        listaEl.innerHTML = `<div class="aviso-centro">Erro ao carregar pedidos.<br><small>${error.message}</small></div>`;
    }
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    carregarPedidosUsuario();
    verificarLoginHeader();
});

// Header e Logout
function verificarLoginHeader() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const userArea = document.getElementById('user-area');
    const loginButton = document.getElementById('loginButton');

    if (usuarioLogado === 'true' && userArea) {
        if (loginButton) loginButton.remove();

        if (document.querySelector('.perfil-icon')) return;

        const perfilIcon = document.createElement('div');
        perfilIcon.className = 'perfil-icon';
        perfilIcon.textContent = '👤';
        perfilIcon.style.cssText = 'cursor: pointer; font-size: 24px; margin-left: 15px; position: relative; display:inline-block;';
        
        const menuPerfil = document.createElement('div');
        menuPerfil.innerHTML = `<button onclick="logout()" style="padding:10px; width:100%; cursor:pointer; background:#fff; border:none; text-align:left;">Sair</button>`;
        menuPerfil.style.cssText = 'display:none; position:absolute; top:35px; right:0; background:#fff; border:1px solid #ccc; min-width:100px; z-index:1000; box-shadow:0 2px 5px rgba(0,0,0,0.2);';
        
        perfilIcon.appendChild(menuPerfil);
        perfilIcon.onclick = (e) => {
             e.stopPropagation();
             menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none';
        };
        
        document.addEventListener('click', (e) => {
            if(!perfilIcon.contains(e.target)) menuPerfil.style.display = 'none';
        });

        userArea.appendChild(perfilIcon);
    }
}

function logout() {
    const keysToRemove = ['usuarioLogado', 'perfilUsuario', 'clienteIdPessoa', 'cpfUsuarioLogado', 'carrinho', 'valorFinalCalculado'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'http://localhost:3001/menu';
}
window.logout = logout;