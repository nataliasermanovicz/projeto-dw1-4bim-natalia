const HOST_BACKEND = 'http://localhost:3001';

async function carregarPedidosUsuario() {
  const listaEl = document.getElementById('pedidos-lista');

  // Verifica se usuário está logado e tem id salvo
  const clienteId = localStorage.getItem('clienteIdPessoa');
  if (!clienteId) {
    listaEl.innerHTML = '<p class="loading-msg">Você precisa estar logado para ver seus pedidos. <a href="/login">Faça login</a>.</p>';
    return;
  }

  try {
    console.log('Buscando dados completos...');

    // Busca paralela de todas as tabelas necessárias
    const [resPedidos, resPagamentos, resRelacaoPg, resFormasPg, resItensPedido, resProdutos] = await Promise.all([
        fetch(`${HOST_BACKEND}/pedido/cliente/${clienteId}`),
        fetch(`${HOST_BACKEND}/pagamento`),
        fetch(`${HOST_BACKEND}/pagamento_forma`).catch(() => ({ ok: false })), 
        fetch(`${HOST_BACKEND}/forma_pagamento`).catch(() => ({ ok: false })),
        fetch(`${HOST_BACKEND}/pedido_produto`).catch(() => ({ ok: false })), 
        fetch(`${HOST_BACKEND}/produto`).catch(() => ({ ok: false }))
    ]);

    if (!resPedidos.ok) {
      listaEl.innerHTML = '<p class="loading-msg">Erro ao carregar pedidos do servidor.</p>';
      return;
    }

    // Converter Respostas para JSON
    const pedidos = await resPedidos.json();
    const pagamentos = resPagamentos.ok ? await resPagamentos.json() : [];
    const relacaoPg = resRelacaoPg.ok ? await resRelacaoPg.json() : [];
    const formasPg = resFormasPg.ok ? await resFormasPg.json() : [];
    const todosItensPedido = resItensPedido.ok ? await resItensPedido.json() : [];
    const catalogoProdutos = resProdutos.ok ? await resProdutos.json() : [];

    const meusPedidos = pedidos;

    if (meusPedidos.length === 0) {
      listaEl.innerHTML = '<p class="loading-msg">Nenhum pedido encontrado para esta conta.</p>';
      return;
    }

    const container = document.createElement('div');

    // Renderização dos Cards
    meusPedidos.forEach(pedido => {
      // Normalização de IDs
      const idPedido = pedido.idpedido || pedido.idPedido;
      const dataRaw = pedido.datadopedido || pedido.dataDoPedido;
      
      // --- Lógica de Pagamento ---
      const pgDoPedido = pagamentos.find(pg => String(pg.pedidoidpedido || pg.PedidoIdPedido) === String(idPedido));
      
      let valorTotal = 0;
      let dataPagamentoRaw = null;
      let nomeFormaPagamento = "Aguardando Pagamento";
      let statusClass = "badge-pendente";

      if (pgDoPedido) {
        valorTotal = Number(pgDoPedido.valortotalpagamento || pgDoPedido.valorTotalPagamento || 0);
        dataPagamentoRaw = pgDoPedido.datapagamento || pgDoPedido.dataPagamento;
        statusClass = "badge-pagamento";

        // Cruzar Pagamento -> Forma
        const relacao = relacaoPg.find(r => String(r.pagamentoidpedido || r.PagamentoIdPedido) === String(idPedido));
        if (relacao) {
            const idForma = relacao.formapagamentoidformapagamento || relacao.FormaPagamentoIdFormaPagamento;
            const formaObj = formasPg.find(f => String(f.idformapagamento || f.idFormaPagamento) === String(idForma));
            if (formaObj) nomeFormaPagamento = formaObj.nomeformapagamento || formaObj.nomeFormaPagamento;
        } else {
            nomeFormaPagamento = "Pago";
        }
      }

      // --- Lógica de Produtos (Itens) ---
      const itensDestePedido = todosItensPedido.filter(item => 
        String(item.pedidoidpedido || item.PedidoIdPedido) === String(idPedido)
      );

      let htmlItens = '';
      if (itensDestePedido.length > 0) {
        htmlItens = `<div class="itens-container"><div class="titulo-itens">Itens Comprados</div>`;
        
        itensDestePedido.forEach(itemRelacao => {
            const idProd = itemRelacao.produtoidproduto || itemRelacao.ProdutoIdProduto;
            const qtd = itemRelacao.quantidade || 0;
            const precoUnitario = Number(itemRelacao.precounitario || itemRelacao.precoUnitario || 0);
            
            const produtoDetalhes = catalogoProdutos.find(p => String(p.idproduto || p.idProduto) === String(idProd));
            const nomeProduto = produtoDetalhes ? (produtoDetalhes.nomeproduto || produtoDetalhes.nomeProduto) : `Produto #${idProd}`;

            htmlItens += `
                <div class="item-row">
                    <span class="item-qtd">${qtd}x</span>
                    <span class="item-nome">${nomeProduto}</span>
                    <span class="item-preco">${(precoUnitario * qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            `;
        });
        htmlItens += `</div>`;
      } else {
        htmlItens = `<div class="itens-container" style="color:#999; font-style:italic; padding:10px;">Nenhum item detalhado encontrado.</div>`;
      }

      // --- Formatadores ---
      const dataFormatada = dataRaw ? new Date(dataRaw).toLocaleDateString('pt-BR') : '--/--/----';
      const valorFormatado = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const dataPagamentoFormatada = dataPagamentoRaw ? new Date(dataPagamentoRaw).toLocaleString('pt-BR') : 'Pendente';

      // --- Montagem do HTML Final ---
      const card = document.createElement('div');
      card.className = 'pedido-card';
      
      card.innerHTML = `
        <div class="pedido-header">
            <span class="pedido-id">Pedido #${idPedido}</span>
            <span class="pedido-data">📅 ${dataFormatada}</span>
        </div>
        
        <div class="pedido-body">
             <div class="info-linha">
                <span class="label">Cliente (CPF):</span>
                <span class="valor">${pedido.clientepessoacpfpessoa || pedido.ClientePessoaCpfPessoa || '...'}</span>
             </div>
             <div class="info-linha">
                <span class="label">Data Pagamento:</span>
                <span class="valor">${dataPagamentoFormatada}</span>
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
                <span class="total-label">Valor Total</span>
                <span class="total-valor">${valorFormatado}</span>
            </div>
        </div>
      `;

      container.appendChild(card);
    });

    listaEl.innerHTML = '';
    listaEl.appendChild(container);

  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    listaEl.innerHTML = '<p class="loading-msg">Erro fatal ao carregar pedidos. Verifique o console.</p>';
  }
}

// Inicialização e Lógica de Usuário
window.addEventListener('DOMContentLoaded', () => {
  carregarPedidosUsuario();

  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const userArea = document.getElementById('user-area');
  const loginButton = document.getElementById('loginButton');

  if (usuarioLogado === 'true' && userArea) {
    if (loginButton) loginButton.remove();

    const perfilIcon = document.createElement('div');
    perfilIcon.className = 'perfil-icon';
    perfilIcon.textContent = '👤';
    perfilIcon.title = 'Perfil';
    perfilIcon.style.cssText = 'position: relative; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; background-color: #8B1E3F; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;';

    const menuPerfil = document.createElement('div');
    menuPerfil.style.cssText = 'display: none; position: absolute; top: 45px; right: 0; background-color: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 120px;';
    menuPerfil.innerHTML = `<button style="background:none; border:none; color:#8B1E3F; padding:10px; cursor:pointer; width:100%; text-align: left; font-size: 16px;" onclick="logout()">Sair</button>`;
    
    perfilIcon.appendChild(menuPerfil);
    
    perfilIcon.onclick = function (e) { 
        e.stopPropagation(); 
        menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none'; 
    };
    
    document.addEventListener('click', function (e) { 
        if (!perfilIcon.contains(e.target)) { 
            menuPerfil.style.display = 'none'; 
        } 
    });

    userArea.appendChild(perfilIcon);
  }
});

function logout() {
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem('perfilUsuario');
  localStorage.removeItem('usuarioEmail');
  localStorage.removeItem('clienteIdPessoa');
  window.location.href = `${HOST_BACKEND}/menu`;
}

window.logout = logout;