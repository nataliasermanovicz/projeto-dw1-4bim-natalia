const HOST_BACKEND = 'http://localhost:3001';

/**
 * Função utilitária para gerar um CPF fictício, já que o DB exige.
 * ATENÇÃO: Em um sistema real, o CPF seria fornecido pelo usuário no formulário.
 */
function gerarCpfFicticio() {
  let cpf = '';
  // Gera 11 dígitos aleatórios
  for (let i = 0; i < 11; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  return cpf;
}

// =======================================================
// === FUNÇÃO DE LOGIN (POST /verificarSenha) ===
// =======================================================
async function realizarLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  // **REMOVIDO: emailRegex restritivo**

  if (email === '' || senha.trim() === '') {
    alert('Por favor, preencha o email e a senha.');
    return;
  }

    const dadosLogin = {
        email: email,
        senha: senha
    };

  try {
    // **CORREÇÃO DE URL:** Chamando a rota correta do loginController.js
    let sql = `${HOST_BACKEND}/login/verificarSenha`;
    alert(`Enviando dados para: ${sql}`); // Debug temporário

    const response = await fetch(sql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // CORS Credentials é necessário para enviar cookies
      credentials: 'include', 
      body: JSON.stringify(dadosLogin)
    });

    const result = await response.json();

    if (response.ok && result.status === 'ok') {
    // alert de sucesso removido para UX mais limpa
    console.log(`Login realizado com sucesso! Bem-vindo(a), ${result.nome}.`);
      
      // Armazena no localStorage o nome do usuário e talvez o ID,
      // mas o estado de login é gerenciado pelo cookie do backend.
      // O backend não retorna o perfil, mantendo a navegação para menu.html
      // (ajuste o perfil/redirecionamento se o backend for atualizado).
      localStorage.setItem('usuarioLogado', 'true');
      //localStorage.setItem('perfilUsuario', result.perfil || 'cliente'); // Perfil não é retornado pelo backend
      
    // Redireciona para a rota do servidor que serve o menu
    window.location.href = `${HOST_BACKEND}/menu`;
      
    } else if (result.status === 'senha_incorreta') {
      alert('Email ou senha incorretos. Tente novamente.');
    } else {
      alert(`Erro ao tentar login: ${result.mensagem || 'Email ou senha inválidos.'}`);
      console.error('Erro no login:', result);
    }
  } catch (error) {
    console.error('Erro ao conectar com o servidor para login:', error);
    alert('Erro de conexão ou no servidor. Tente novamente mais tarde.');
  }
}

// =======================================================
// === FUNÇÃO DE CADASTRO (POST /auth) ===
// =======================================================
async function fazerCadastro() {
    const nome = document.getElementById('novoNome').value.trim();
    const dataNascimento = document.getElementById('novaDataNascimento').value;
    const email = document.getElementById('novoEmail').value.trim();
    const senha = document.getElementById('novaSenha').value;
    // **REMOVIDO: emailRegex restritivo**

    if (nome === '' || !dataNascimento || email === '' || senha.trim() === '') {
        alert('Por favor, preencha todos os campos do cadastro.');
        return;
    }

    // Gera um CPF fictício para atender à tabela 'pessoa'
    const cpfpessoa = gerarCpfFicticio();

    const dadosCadastro = {
        // Mapeamento correto dos campos para o loginController.criarPessoa
        cpfpessoa: cpfpessoa,
        nomepessoa: nome, 
        emailpessoa: email, 
        senhapessoa: senha, 
        datanascimentopessoa: dataNascimento // Formato yyyy-mm-dd
    };

    try {
        // **CORREÇÃO DE URL:** Rota de cadastro/criação de pessoa: POST /auth
        const response = await fetch(`${HOST_BACKEND}/auth`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCadastro)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso! Agora faça login.');
            window.location.href = 'login.html';
        } else {
            // Exibe a mensagem de erro retornada pelo servidor (ex: email duplicado)
            alert(`Erro no cadastro: ${result.error || result.mensagem || 'Verifique os dados e tente novamente.'}`);
            console.error('Erro de cadastro:', result);
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor para cadastro:', error);
        alert('Erro de conexão ou no servidor. Tente novamente mais tarde.');
    }
}

// =======================================================
// === LÓGICA DE PRODUTOS E CARRINHO (MANTIDA) ===
// =======================================================
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
    window.valorFinalCalculado = total; // Salva o total para a função de pagamento
    
    // Assegura que a UI de carrinho está visível
    const home = document.getElementById('home');
    if (home) home.style.display = 'none';
    const paginaCarrinho = document.getElementById('pagina-carrinho');
    if (paginaCarrinho) paginaCarrinho.style.display = 'block';
}

function mostrarFormaPagamento() {
    const logado = localStorage.getItem('usuarioLogado');
    // NOTE: O estado de login real deve ser verificado via API ou cookie no backend.
    // Para simplificar no frontend, mantemos a verificação do localStorage
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

// **CORREÇÃO: Implementação para salvar o Pedido no banco de dados**
async function concluirCompra() {
    const clienteId = localStorage.getItem('clienteIdPessoa'); // ID da Pessoa logada (cliente)
    const valorTotal = window.valorFinalCalculado; 
    let carrinhoSalvo = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    if (carrinhoSalvo.length === 0) {
        alert("Erro: Carrinho vazio.");
        return;
    }
    
    // Em um sistema real, o clienteId deveria ser obtido do cookie/sessão no backend,
    // mas se o frontend precisa enviá-lo, o login precisa tê-lo retornado e salvo.
    // Como o loginController atual NÃO retorna o ID da Pessoa, esta parte pode falhar
    // se o clienteIdPessoa não for um valor válido (assumindo 1 para testes se necessário)
    const idDoCliente = clienteId || 1; // Usando 1 como fallback se não foi salvo no login
    
    if (!idDoCliente) {
         alert("Erro: ID do cliente não encontrado. Não é possível finalizar a compra.");
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
        dataDoPedido: new Date().toISOString().slice(0, 10), // Data atual no formato AAAA-MM-DD
        ClientePessoaIdPessoa: idDoCliente,
        FuncionarioPessoaIdPessoa: null, 
        
        // Dados adicionais que o backend precisa processar:
        itensPedido: itensPedido, 
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
            alert("Compra finalizada com sucesso! Seu pedido foi registrado.");
        } else {
            alert(`A compra foi concluída, mas houve um erro ao salvar o pedido: ${resultado.error || 'Erro desconhecido.'}`);
            console.error("Erro ao salvar pedido:", resultado);
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
    const mensagemFinal = document.getElementById('mensagem-final');
    if(mensagemFinal) mensagemFinal.style.display = 'block';

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
            // alert("Produto não encontrado."); // Removendo alert para evitar bloqueio
        }
    });
}

// Lógica exclusiva para carrinho.html
if (window.location.pathname.includes('carrinho.html')) {
    window.addEventListener('DOMContentLoaded', () => {
        // Garante que mostrarCarrinho é chamada para exibir o carrinho
        mostrarCarrinho();
    });

    // Função de pagamento PIX (mantida)
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

        // NOTE: A biblioteca QRCode.js não está inclusa no script, mas a lógica foi mantida.
        // É necessário incluir a tag <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        // no carrinho.html para que esta função funcione.
        if (typeof QRCode !== 'undefined') {
             new QRCode(qrCodeDiv, {
                text: payloadFinal,
                width: 250,
                height: 250,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        const info = document.createElement('div');
        info.className = 'nome-valor';
        info.innerHTML = `
            <p><strong>Nome:</strong> ${nomeRecebedor}</p>
            <p><strong>CPF (PIX):</strong> ${chavePix}</p>
            <p><strong>Valor:</strong> R$ ${valor}</p>
        `;
        qrCodeDiv.appendChild(info);
    }
    // Expõe funções para uso no HTML, se necessário
    window.pagarPIX = pagarPIX;
    window.mostrarFormaPagamento = mostrarFormaPagamento;
    window.pagarComCartao = pagarComCartao;
    window.pagarComPix = pagarComPix;
    window.finalizarCompraCartao = finalizarCompraCartao;
    window.finalizarCompraPix = finalizarCompraPix;
    window.formatarCartao = formatarCartao;
}


// =======================================================
// === LÓGICA DE PERFIL E LOGOUT (CORRIGIDA) ===
// =======================================================

// Mostra ícone de perfil se estiver logado e cria opção de logout
window.addEventListener('DOMContentLoaded', () => {
    // Mantém a verificação via localStorage para gerenciar a UI do frontend
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

// **CORREÇÃO: Implementação do logout para limpar cookie no backend**
async function logout() {
    try {
        const response = await fetch(`${HOST_BACKEND}/login/logout`, {
            method: 'POST',
            credentials: 'include' // Essencial para enviar o cookie
        });

        if (response.ok) {
            console.log('Logout efetuado no servidor.');
        } else {
            console.warn('Erro ao deslogar no servidor, mas faremos o logout local.');
        }
    } catch (error) {
        console.error('Erro de conexão durante o logout:', error);
    }
    
    // Limpeza local, independentemente do sucesso da chamada ao backend
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('perfilUsuario');
    localStorage.removeItem('clienteIdPessoa'); 
    localStorage.removeItem('carrinho'); 
    localStorage.removeItem('valorFinalCalculado');

    // Redireciona para a rota do servidor que serve o menu
    window.location.href = `${HOST_BACKEND}/menu`;
}

// Expõe funções globais que são usadas no HTML
window.realizarLogin = realizarLogin;
window.fazerCadastro = fazerCadastro;
window.logout = logout;
window.verProduto = verProduto;
window.adicionarCarrinho = adicionarCarrinho;
window.mostrarCarrinho = mostrarCarrinho;
window.concluirCompra = concluirCompra;