const HOST_BACKEND = 'http://localhost:3001';

// =======================================================
// === FUNÇÃO DE LOGIN (POST /verificarSenha) ===
// =======================================================
async function realizarLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (email === '' || senha.trim() === '') {
    alert('Por favor, preencha o email e a senha.');
    return;
  }

  const dadosLogin = {
    email: email,
    senha: senha
  };

  try {
    let sql = `${HOST_BACKEND}/login/verificarSenha`;
    
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
      console.log(`Login realizado com sucesso! Bem-vindo(a), ${result.nome}.`);

      // 1. Marca como logado
      localStorage.setItem('usuarioLogado', 'true');

      // 2. Salva o ID da pessoa
      if (result.idpessoa) {
        localStorage.setItem('clienteIdPessoa', String(result.idpessoa));
      }

      // 3. Salva o CPF (Essencial para o Carrinho funcionar)
      const cpfParaSalvar = result.cpfpessoa || result.cpf || result.idpessoa;
      
      if (cpfParaSalvar) {
          localStorage.setItem('cpfUsuarioLogado', String(cpfParaSalvar));
      } else {
          console.warn("AVISO: O Backend não retornou o CPF. O carrinho pode falhar.");
      }

      // 4. Salva Perfil e Flag de Gerente
      if (result.perfil) {
        localStorage.setItem('perfilUsuario', result.perfil);
      }
      if (result.ehGerente) {
        localStorage.setItem('ehGerente', 'true');
      }

      // 5. Lógica de Redirecionamento Inteligente
      const urlParams = new URLSearchParams(window.location.search);
      const redirectDestino = urlParams.get('redirect');

      if (redirectDestino === 'carrinho') {
          // Se veio do carrinho, volta para lá
          window.location.href = 'http://localhost:3001/carrinho.html';
      } else if (result.ehGerente) {
          // Se é gerente, menu de gerente
          window.location.href = `${HOST_BACKEND}/frontend-Gerente/menu.html`;
      } else {
          // Usuário comum, menu padrão
          window.location.href = `${HOST_BACKEND}/menu`;
      }

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

// Expõe a função para ser usada no onclick do HTML
window.realizarLogin = realizarLogin;