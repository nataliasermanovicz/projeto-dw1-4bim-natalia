const db = require('../database.js');


const path = require('path');

exports.abrirTelaLogin = (req, res) => {
  console.log('loginController - Rota /login - Acessando login.html');
  res.sendFile(path.join(__dirname, '../../html/login/login.html'));
};

exports.verificaSeUsuarioEstaLogado = (req, res) => {
  //console.log('loginController -> verificaSeUsuarioEstaLogado - Verificando se usuário está logado via cookie');

  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário

  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
    // Usuário está logado. Retorna 'ok' e os dados do usuário.
    // É importante garantir que o valor do cookie 'usuarioLogado' seja o nome/ID do usuário.
    res.json({
      status: 'ok',
      usuario: usuario // Retorna o valor do cookie, que é o nome/ID do usuário
    });
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    // res.json({
    //   status: 'nao_logado',
    //   mensagem: 'Usuário não autenticado.'
    // });

    res.redirect('/login');
  }
}


// Funções do controller
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY cpfpessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  const sql = 'SELECT nomepessoa FROM pessoa WHERE emailpessoa = $1'; // Postgres usa $1, $2...

  console.log('rota verificarEmail: ', sql, email);

  try {
    const result = await db.query(sql, [email]); // igual listarPessoas

    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nomepessoa });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};


// Verificar senha
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;
 //console.log('loginController - Rota /verificarSenha - Verificando senha do usuário - backend', email, senha);
  const sqlPessoa = `
    SELECT cpfpessoa, nomepessoa 
    FROM Pessoa 
    WHERE emailpessoa = $1 AND senhapessoa = $2
  `;
  const sqlCliente = `
    SELECT * 
    FROM Cliente 
    WHERE pessoacpfpessoa = $1
  `;

    const sqlFuncionario = `
    SELECT * 
    FROM Funcionario 
    WHERE pessoacpfpessoa = $1
  `;

  //console.log('Rota verificarSenha:', sqlPessoa, email, senha);

  try {
    // 1. Verifica se existe pessoa com email/senha
    const resultPessoa = await db.query(sqlPessoa, [email, senha]);

    if (resultPessoa.rows.length === 0) {
      return res.json({ status: 'senha_incorreta' });
    }

    const { cpfpessoa, nomepessoa } = resultPessoa.rows[0];
    console.log('Usuário encontrado:', resultPessoa.rows[0]);

    // 2. Verifica se é cliente
    const resultCliente = await db.query(sqlCliente, [cpfpessoa]);

    let ehCliente = null;
    if (resultCliente.rows.length === 0) {
      ehCliente = "naoEhCliente";
    } else {
      ehCliente = "ehCliente";
    }

    // 2b. Verifica se é funcionário
    const resultFuncionario = await db.query(sqlFuncionario, [cpfpessoa]);

    let ehFuncionario = null;
    if (resultFuncionario.rows.length === 0) {
      ehFuncionario = "naoEhFuncionario";
    } else {
      ehFuncionario = "ehFuncionario";
    }

    console.log(`Tipo de usuário - Cliente: ${ehCliente}, Funcionário: ${ehFuncionario}`);

    // 3. Define cookie
    res.cookie('usuarioLogado', nomepessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    // 4. Retorna dados para o html, o cookie será enviado ao html
    return res.json({
      status: 'ok',
      nome: nomepessoa,
    });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}


// Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });
  console.log("Cookie 'usuarioLogado' removido com sucesso");
  res.json({ status: 'deslogado' });
}


exports.criarPessoa = async (req, res) => {
  //  console.log('Criando pessoa com dados:', req.body);
  try {
    const { cpfpessoa, nomepessoa, emailpessoa, senhapessoa, primeiro_acesso_pessoa = true, datanascimentopessoa } = req.body;

    // Validação básica
    if (!nomepessoa || !emailpessoa || !senhapessoa) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailpessoa)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const result = await db.query(
      'INSERT INTO pessoa (cpfpessoa, nomepessoa, emailpessoa, senhapessoa, primeiro_acesso_pessoa, datanascimentopessoa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cpfpessoa, nomepessoa, emailpessoa, senhapessoa, primeiro_acesso_pessoa, datanascimentopessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_emailpessoa_key') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'loginController-obterPessoa - ID deve ser um número válido' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE emailpessoa = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [id]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senhapessoa !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await db.query(
      'UPDATE pessoa SET senhapessoa = $1 WHERE cpfpessoa = $2 RETURNING cpfpessoa, nomepessoa, emailpessoa, primeiro_acesso_pessoa, datanascimentopessoa',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

