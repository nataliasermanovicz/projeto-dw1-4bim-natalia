const HOST_BACKEND = 'http://localhost:3001';

async function fazerCadastro() {
  try {
    const cpf = document.getElementById('novoCpf').value.trim();
    const nome = document.getElementById('novoNome').value.trim();
    const dataNascimento = document.getElementById('novaDataNascimento').value; // yyyy-mm-dd
    const email = document.getElementById('novoEmail').value.trim();
    const senha = document.getElementById('novaSenha').value;

    // Validações básicas
    if (!cpf || !nome || !email || !senha) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação do formato do CPF: 000.000.000-00
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(cpf)) {
      alert('CPF inválido. Use o formato 000.000.000-00');
      return;
    }

    // Monta o payload conforme esperado pelo backend
    // Enviar apenas os dígitos do CPF para o backend (normalmente é mais seguro armazenar sem máscara)
    const cpfDigits = cpf.replace(/\D/g, '');

    const payload = {
      cpfPessoa: cpfDigits,
      nomePessoa: nome,
      emailPessoa: email,
      senhaPessoa: senha,
      dataNascimentoPessoa: dataNascimento || null,
      EnderecoIdEndereco: null
    };

    const res = await fetch(`${HOST_BACKEND}/pessoa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 201) {
      alert('Cadastro realizado com sucesso!');
      // Redireciona para o menu (rota do backend que serve a página)
      window.location.href = `${HOST_BACKEND}/menu`;
      return;
    }

    // Se não for 201, tenta extrair mensagem de erro
    const data = await res.json();
    if (data && data.error) {
      alert('Erro ao cadastrar: ' + data.error);
    } else {
      alert('Erro ao cadastrar (resposta inesperada).');
    }
  } catch (error) {
    console.error('Erro no cadastro:', error);
    alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
  }
}

// Expõe a função globalmente para o onsubmit no HTML chamar
window.fazerCadastro = fazerCadastro;

// --- Máscara e comportamento do campo CPF ---
function formatCPFInput(e) {
  const input = e.target;
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

document.addEventListener('DOMContentLoaded', () => {
  const cpfInput = document.getElementById('novoCpf');
  if (!cpfInput) return;
  cpfInput.setAttribute('maxlength', '14');
  cpfInput.setAttribute('inputmode', 'numeric');
  cpfInput.addEventListener('input', formatCPFInput);
  cpfInput.addEventListener('paste', function (ev) {
    ev.preventDefault();
    const paste = (ev.clipboardData || window.clipboardData).getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 11);
    this.value = digits;
    formatCPFInput({ target: this });
  });
});
