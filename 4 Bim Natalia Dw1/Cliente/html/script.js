const HOST_BACKEND = 'http://localhost:3001'; // **CORREÇÃO: Usar a porta 3001 do servidor.js**

function realizarLogin() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@email\.com$/;

  if (!emailRegex.test(email)) {
    alert('Insira um email válido que termine com "@email.com".');
    return;
  }

  if (senha.trim() === '') {
    alert('Digite sua senha.');
    return;
  }

  // **CORREÇÃO DE URL:**
  fetch(`${HOST_BACKEND}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  })
    .then(res => res.json())
    .then(data => {
      if (data.erro) {
        alert(data.erro);
      } else {
        localStorage.setItem('usuarioLogado', 'true');
        localStorage.setItem('perfilUsuario', data.usuario.perfil);
        localStorage.setItem('usuarioEmail', data.usuario.email);
        // **NOVO:** Salvar o ID da Pessoa Cliente (assumindo que o login o retorna)
        localStorage.setItem('clienteIdPessoa', data.usuario.idpessoa);
        
        if (data.usuario.perfil === 'gerente') {
          window.location.href = '../html gerente/menu_gerente.html';
        } else {
          window.location.href = 'menu.html';
        }
      }
    })
    .catch(() => alert('Erro ao conectar ao servidor.'));
}


// **CORREÇÃO: Padronizar chaves dos produtos com o DB (idProduto, nomeProduto, precoUnitario)**
const produtos = [
    { idProduto: 1, nomeProduto: 'Risqué Felicidade', descricao: 'Esmalte Vermelho "Felicidade" 8 ml - R$ 12.90', imagem: '../imgs/3.png', precoUnitario: 12.90 },
    { idProduto: 2, nomeProduto: 'Risqué Condessa', descricao: 'Esmalte Rosa "Condessa" 8 ml - R$ 12.90', imagem: '../imgs/2.png', precoUnitario: 12.90 },
    { idProduto: 3, nomeProduto: 'Risqué Preto Sépia', descricao: 'Esmalte Preto "Preto Sépia" 8 ml - R$ 12.90', imagem: '../imgs/6.png', precoUnitario: 12.90 },
    { idProduto: 4, nomeProduto: 'Risqué A.Mar', descricao: 'Esmalte Azul "A.Mar" 8 ml - R$ 16.90', imagem: '../imgs/1.png', precoUnitario: 16.90 },
    { idProduto: 5, nomeProduto: 'Risqué Granulado Rosé', descricao: 'Esmalte Rosa "Granulado Rosé" 8 ml - R$ 15.90', imagem: '../imgs/4.png', precoUnitario: 15.90 },
    { idProduto: 6, nomeProduto: 'Risqué Menta.liza', descricao: 'Esmalte Verde "Menta.liza" 8 ml - R$ 15.90', imagem: '../imgs/5.png', precoUnitario: 15.90 }
];

let produtoSelecionado = null;
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

function verProduto(id) {
    // **CORREÇÃO: Buscar por idProduto**
    produtoSelecionado = produtos.find(p => p.idProduto === id);
    document.getElementById('nome-produto').textContent = produtoSelecionado.nomeProduto; // **CORREÇÃO**
    document.getElementById('descricao-produto').textContent = produtoSelecionado.descricao;
    document.getElementById('imagem-produto').src = produtoSelecionado.imagem;
    document.getElementById('home').style.display = 'none';
    document.getElementById('pagina-produto').style.display = 'block';
}

function adicionarCarrinho() {
    const quantidade = parseInt(document.getElementById('quantidade').value);
    if (!quantidade || quantidade <= 0) {
        alert('Por favor, selecione uma quantidade válida.');
        return;
    }

    // **CORREÇÃO: Usar idProduto**
    const itemExistente = carrinho.find(item => item.idProduto === produtoSelecionado.idProduto);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        // **CORREÇÃO: Salvar com chaves padronizadas (idProduto, nomeProduto, precoUnitario)**
        carrinho.push({ 
            idProduto: produtoSelecionado.idProduto, 
            nomeProduto: produtoSelecionado.nomeProduto,
            precoUnitario: produtoSelecionado.precoUnitario,
            quantidade: quantidade 
        });
    }
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    alert('Produto adicionado ao carrinho!');
}

function mostrarCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const totalSpan = document.getElementById('total');
    lista.innerHTML = '';
    let total = 0;

    carrinho.forEach(item => {
        const li = document.createElement('li');
        // **CORREÇÃO: Usar as chaves padronizadas**
        li.textContent = `${item.nomeProduto} - Quantidade: ${item.quantidade} - Preço: R$ ${item.precoUnitario.toFixed(2)}`;
        lista.appendChild(li);
        total += item.quantidade * item.precoUnitario;
    });

    totalSpan.textContent = total.toFixed(2);
    document.getElementById('home').style.display = 'none';
    document.getElementById('pagina-carrinho').style.display = 'block';
}

function mostrarFormaPagamento() {
    const logado = localStorage.getItem('usuarioLogado');
    if (logado !== 'true') {
        alert('Você precisa estar logado para finalizar a compra. Por favor, faça login.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('forma-pagamento').style.display = 'block';
}

function pagarComCartao() {
    document.getElementById('pagamento-cartao').style.display = 'block';
    document.getElementById('pagamento-pix').style.display = 'none';
}

function pagarComPix() {
    document.getElementById('pagamento-pix').style.display = 'block';
    document.getElementById('pagamento-cartao').style.display = 'none';
}

function formatarCartao(input) {
    input.value = input.value
        .replace(/\D/g, '')
        .replace(/(\d{4})(?=\d)/g, '$1 ')
        .trim();
}

function validarCartao(numero) {
    return /^\d{4} \d{4} \d{4} \d{4}$/.test(numero);
}

function finalizarCompraCartao() {
    const numeroCartao = document.getElementById('numero-cartao').value;
    if (validarCartao(numeroCartao)) {
        concluirCompra();
    } else {
        alert('Número de cartão inválido.');
    }
}

function finalizarCompraPix() {
    concluirCompra();
}

// **CORREÇÃO: Implementação para salvar no banco de dados**
async function concluirCompra() {
    const clienteId = localStorage.getItem('clienteIdPessoa'); // ID da Pessoa logada (cliente)
    const valorTotal = window.valorFinalCalculado; 
    let carrinhoSalvo = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    if (carrinhoSalvo.length === 0 || !clienteId || !valorTotal) {
        alert("Erro: Carrinho vazio, usuário não logado ou valor total inválido.");
        return;
    }

    // Mapeia o carrinho para o formato ItemPedido (assumindo que o backend
    // cuidará da inserção na tabela ItemPedido)
    const itensPedido = carrinhoSalvo.map(item => ({
        idProduto: item.idProduto, 
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario
    }));

    const dadosPedido = {
        // Campos que o pedidoController.js espera receber no body:
        // O PedidoController espera que o ID do Pedido seja enviado (o que é incorreto
        // se idPedido for SERIAL, mas enviamos NULL e o backend deve ignorar)
        idPedido: null, // Deixe o backend gerar se for SERIAL
        dataDoPedido: new Date().toISOString().slice(0, 10), // Data atual no formato AAAA-MM-DD
        ClientePessoaIdPessoa: clienteId,
        FuncionarioPessoaIdPessoa: null, // Assumindo que o cliente não é funcionário
        
        // Dados adicionais que o backend precisa processar:
        itensPedido: itensPedido, // Este campo deve ser lido e processado pelo backend
        valorTotal: valorTotal
    };

    try {
        // **CORREÇÃO DE URL:**
        const resposta = await fetch(`${HOST_BACKEND}/pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPedido)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            console.log("Pedido salvo com sucesso:", resultado);
            // Continua para a finalização da UI
        } else {
            alert(`A compra foi concluída, mas houve um erro ao salvar o pedido: ${resultado.error || 'Erro desconhecido.'}`);
            console.error("Erro ao salvar pedido:", resultado);
            // Se o erro foi do servidor, não bloqueamos o usuário, mas avisamos.
        }
    } catch (error) {
        console.error("Erro de rede/servidor ao finalizar a compra:", error);
        alert("Aviso: Houve um erro de conexão ao tentar salvar o pedido. Tente novamente.");
        return; 
    }
    
    // Lógica de finalização da UI
    carrinho = [];
    localStorage.removeItem('carrinho');
    localStorage.removeItem('valorFinalCalculado');

    document.getElementById('pagina-carrinho').style.display = 'none';
    document.getElementById('mensagem-final').style.display = 'block';

    setTimeout(() => {
        window.location.href = 'menu.html';
    }, 2000);
}

// Detecta se está na página de produto e carrega o produto da URL
if (
    window.location.pathname.includes('produto.html') ||
    window.location.pathname.includes('produto_gerente.html')
) {
    window.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = parseInt(urlParams.get('id'));
        if (!isNaN(id)) {
            verProduto(id);
        } else {
            alert("Produto não encontrado.");
        }
    });
}

// Lógica exclusiva para carrinho.html
if (window.location.pathname.includes('carrinho.html')) {
    window.addEventListener('DOMContentLoaded', () => {
        mostrarCarrinho();
    });

    // Esta função mostrarCarrinho está duplicada e precisa usar a versão global corrigida, 
    // mas se for exclusiva para carrinho.html, garantimos a correção aqui também.
    function mostrarCarrinho() {
        const lista = document.getElementById('lista-carrinho');
        const totalSpan = document.getElementById('total');
        lista.innerHTML = '';
        let total = 0;

        carrinho.forEach(item => {
            const li = document.createElement('li');
            // **CORREÇÃO: Usar as chaves padronizadas**
            li.textContent = `${item.nomeProduto} - Quantidade: ${item.quantidade} - Preço: R$ ${item.precoUnitario.toFixed(2)}`;
            lista.appendChild(li);
            total += item.quantidade * item.precoUnitario;
        });

        totalSpan.textContent = total.toFixed(2);
        window.valorFinalCalculado = total;
        document.getElementById('pagina-carrinho').style.display = 'block';
    }

    function pagarPIX() {
        document.getElementById('pagamento-pix').style.display = 'block';
        document.getElementById('pagamento-cartao').style.display = 'none';

        const valor = window.valorFinalCalculado.toFixed(2);
        const chavePix = '02964990999';
        const nomeRecebedor = 'Celso Mainko';
        const cidade = 'SAO PAULO';
        const descricao = 'Pagamento Doceria Pink Delfins';

        function formatField(id, value) {
            const length = value.length.toString().padStart(2, '0');
            return id + length + value;
        }

        let payloadSemCRC =
            formatField("00", "01") +
            formatField("26",
                formatField("00", "BR.GOV.BCB.PIX") +
                formatField("01", chavePix) +
                formatField("02", descricao)
            ) +
            formatField("52", "0000") +
            formatField("53", "986") +
            formatField("54", valor) +
            formatField("58", "BR") +
            formatField("59", nomeRecebedor) +
            formatField("60", cidade) +
            formatField("62", formatField("05", "***")) +
            "6304";

        function crc16(str) {
            let crc = 0xFFFF;
            for (let c = 0; c < str.length; c++) {
                crc ^= str.charCodeAt(c) << 8;
                for (let i = 0; i < 8; i++) {
                    if ((crc & 0x8000) !== 0) {
                        crc = (crc << 1) ^ 0x1021;
                    } else {
                        crc <<= 1;
                    }
                    crc &= 0xFFFF;
                }
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        }

        const crc = crc16(payloadSemCRC);
        const payloadFinal = payloadSemCRC + crc;

        const qrCodeDiv = document.getElementById('qrcode');
        qrCodeDiv.innerHTML = '';
        document.getElementById('qrcode-area').style.display = 'block';

        new QRCode(qrCodeDiv, {
            text: payloadFinal,
            width: 250,
            height: 250,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        const info = document.createElement('div');
        info.className = 'nome-valor';
        info.innerHTML = `
            <p><strong>Nome:</strong> ${nomeRecebedor}</p>
            <p><strong>CPF (PIX):</strong> ${chavePix}</p>
            <p><strong>Valor:</strong> R$ ${valor}</p>
        `;
        qrCodeDiv.appendChild(info);
    }
}

// Mostra ícone de perfil se estiver logado e cria opção de logout
window.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (usuarioLogado === 'true') {
        const userArea = document.getElementById('user-area');
        const loginButton = document.getElementById('loginButton');

        if (loginButton) {
            loginButton.remove();
        }

        const perfilIcon = document.createElement('div');
        perfilIcon.className = 'perfil-icon';
        perfilIcon.textContent = '👤';
        perfilIcon.title = 'Perfil';
        perfilIcon.style.position = 'relative';
        perfilIcon.style.cursor = 'pointer';

        const menuPerfil = document.createElement('div');
        menuPerfil.style.display = 'none';
        menuPerfil.style.position = 'absolute';
        menuPerfil.style.top = '45px';
        menuPerfil.style.right = '0';
        menuPerfil.style.backgroundColor = '#fff';
        menuPerfil.style.border = '1px solid #ccc';
        menuPerfil.style.borderRadius = '6px';
        menuPerfil.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        menuPerfil.style.zIndex = '1000';
        menuPerfil.innerHTML = `<button style="background:none; border:none; color:#8B1E3F; padding:10px; cursor:pointer; width:100%;" onclick="logout()">Sair</button>`;

        perfilIcon.appendChild(menuPerfil);

        perfilIcon.onclick = function () {
            menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'block' : 'none';
        };

        document.addEventListener('click', function (e) {
            if (!perfilIcon.contains(e.target)) {
                menuPerfil.style.display = 'none';
            }
        });

        if (userArea) {
            userArea.appendChild(perfilIcon);
        }
    }
});

function logout() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('perfilUsuario');
    localStorage.removeItem('clienteIdPessoa'); // **NOVO: Limpar ID da Pessoa**
    window.location.href = 'login.html';
}


function fazerCadastro() {
    const nome = document.getElementById('novoNome').value.trim();
    const dataNascimento = document.getElementById('novaDataNascimento').value;
    const email = document.getElementById('novoEmail').value.trim();
    const senha = document.getElementById('novaSenha').value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@email\.com$/;

    if (nome === '') {
        alert('Por favor, insira seu nome.');
        return;
    }

    if (!dataNascimento) {
        alert('Por favor, insira sua data de nascimento.');
        return;
    }

    if (!emailRegex.test(email)) {
        alert('Insira um email válido que termine com "@email.com".');
        return;
    }

    if (senha.trim() === '') {
        alert('Crie uma senha.');
        return;
    }

    // Envia para o backend
    // **CORREÇÃO DE URL:**
    fetch(`${HOST_BACKEND}/api/cadastro`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, nome, dataNascimento })
    })
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                alert(data.erro);
            } else {
                alert('Cadastro realizado! Agora faça login.');
                window.location.href = 'login.html';
            }
        })
        .catch(() => alert('Erro ao conectar ao servidor.'));
}