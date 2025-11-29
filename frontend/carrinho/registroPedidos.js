const HOST_BACKEND = 'http://localhost:3001';

async function carregarPedidosUsuario() {
  const listaEl = document.getElementById('pedidos-lista');
  listaEl.innerHTML = '<p>Carregando pedidos...</p>';

  // Verifica se usuário está logado e tem id salvo
  const clienteId = localStorage.getItem('clienteIdPessoa');
  if (!clienteId) {
    listaEl.innerHTML = '<p>Você precisa estar logado para ver seus pedidos. <a href="/login">Faça login</a>.</p>';
    return;
  }

  try {
    // Pega apenas os pedidos do cliente via rota específica
    console.log('clienteId (localStorage):', clienteId);
    const resPedidos = await fetch(`${HOST_BACKEND}/pedido/cliente/${clienteId}`);
    if (!resPedidos.ok) {
      console.error('Erro na requisição de pedidos por cliente:', resPedidos.status, await resPedidos.text());
      listaEl.innerHTML = '<p>Erro ao carregar pedidos do servidor.</p>';
      return;
    }
    const pedidos = await resPedidos.json();
    console.log('Pedidos retornados pelo backend (cliente):', pedidos);

    const meusPedidos = pedidos; // já são os pedidos do cliente retornados pelo backend

    if (meusPedidos.length === 0) {
      listaEl.innerHTML = '<p>Nenhum pedido encontrado para esta conta.</p>';
      return;
    }

    // Carrega todos os pagamentos para relacionar
    const resPagamentos = await fetch(`${HOST_BACKEND}/pagamento`);
    const pagamentos = await resPagamentos.json();

    // Cria marcação
    const container = document.createElement('div');

    meusPedidos.forEach(pedido => {
      const pedidoBox = document.createElement('div');
      pedidoBox.style.backgroundColor = '#fff';
      pedidoBox.style.padding = '20px';
      pedidoBox.style.marginBottom = '16px';
      pedidoBox.style.borderRadius = '8px';
      pedidoBox.style.boxShadow = '0 6px 15px rgba(0,0,0,0.08)';

      const h = document.createElement('h3');
      h.textContent = `Pedido #${pedido.idpedido || pedido.idPedido || pedido.idPedido || pedido.idPedido}`;
      pedidoBox.appendChild(h);

      const meta = document.createElement('p');
      meta.innerHTML = `<strong>Data:</strong> ${pedido.datadopedido || pedido.dataDoPedido || pedido.datadopedido || ''} &nbsp; <strong>Cliente ID:</strong> ${pedido.clientepessoaidpessoa || pedido.ClientePessoaIdPessoa || ''}`;
      pedidoBox.appendChild(meta);

      // Lista itens de pagamento relacionados ao pedido
      const pagamentosDoPedido = pagamentos.filter(pg => String(pg.pedidoidpedido || pg.PedidoIdPedido || pg.PedidoIdPedido) === String(pedido.idpedido || pedido.idPedido || pedido.idPedido));

      if (pagamentosDoPedido.length > 0) {
        const tituloPag = document.createElement('h4');
        tituloPag.textContent = 'Pagamentos';
        pedidoBox.appendChild(tituloPag);

        pagamentosDoPedido.forEach(pg => {
          const pgEl = document.createElement('div');
          pgEl.style.borderTop = '1px solid #eee';
          pgEl.style.paddingTop = '8px';
          pgEl.innerHTML = `<p><strong>Data do pagamento:</strong> ${pg.datapagamento || pg.dataPagamento || ''}</p>
            <p><strong>Valor:</strong> R$ ${Number(pg.valortotalpagamento || pg.valorTotalPagamento || pg.valorTotalPagamento || 0).toFixed(2)}</p>`;
          pedidoBox.appendChild(pgEl);
        });
      } else {
        const noPg = document.createElement('p');
        noPg.textContent = 'Nenhum pagamento registrado para este pedido.';
        pedidoBox.appendChild(noPg);
      }

      container.appendChild(pedidoBox);
    });

    listaEl.innerHTML = '';
    listaEl.appendChild(container);

  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    listaEl.innerHTML = '<p>Erro ao carregar pedidos. Verifique a conexão com o servidor.</p>';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  carregarPedidosUsuario();

  // Reutiliza lógica de exibir botão de login/perfil similar ao menu
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
    perfilIcon.onclick = function (e) { e.stopPropagation(); menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none'; };
    document.addEventListener('click', function (e) { if (!perfilIcon.contains(e.target)) { menuPerfil.style.display = 'none'; } });

    userArea.appendChild(perfilIcon);
  }
});

// logout local (mantém comportamento do menu.js)
function logout() {
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem('perfilUsuario');
  localStorage.removeItem('usuarioEmail');
  localStorage.removeItem('clienteIdPessoa');
  window.location.href = `${HOST_BACKEND}/menu`;
}

window.logout = logout;