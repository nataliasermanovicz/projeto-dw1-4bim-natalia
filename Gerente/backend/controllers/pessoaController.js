//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
//  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../html/pessoa/pessoa.html'));
} 

exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pessoa ORDER BY cpfPessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPessoa = async (req, res) => {
  try {
    const { cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco } = req.body;

    // Validação básica
    if (!cpfPessoa || !nomePessoa || !emailPessoa || !senhaPessoa) {
      return res.status(400).json({
        error: 'CPF, nome, email e senha são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailPessoa)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const result = await query(
      'INSERT INTO pessoa (cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_emailPessoa_key') {
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
}

exports.obterPessoa = async (req, res) => {
  try {
    const cpf = req.params.cpf; // CPF é string

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pessoa WHERE cpfPessoa = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPessoa = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const { nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco } = req.body;

    // Validação de email se fornecido
    if (emailPessoa) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailPessoa)) {
        return res.status(400).json({
          error: 'Formato de email inválido'
        });
      }
    }
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT * FROM pessoa WHERE cpfPessoa = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Atualiza a pessoa
    const updateResult = await query(
      'UPDATE pessoa SET nomePessoa = $1, emailPessoa = $2, senhaPessoa = $3, dataNascimentoPessoa = $4, EnderecoIdEndereco = $5 WHERE cpfPessoa = $6 RETURNING *',
      [nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco, cpf]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);

    // Verifica se é erro de email duplicado
    if (error.code === '23505' && error.constraint === 'pessoa_emailPessoa_key') {
      return res.status(400).json({
        error: 'Email já está em uso por outra pessoa'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPessoa = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT * FROM pessoa WHERE cpfPessoa = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Deleta a pessoa (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pessoa WHERE cpfPessoa = $1',
      [cpf]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pessoa com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pessoa WHERE emailPessoa = $1',
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
}

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const { senhaAtual, novaSenha } = req.body;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await query(
      'SELECT * FROM pessoa WHERE cpfPessoa = $1',
      [cpf]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senhaPessoa !== senhaAtual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await query(
      'UPDATE pessoa SET senhaPessoa = $1 WHERE cpfPessoa = $2 RETURNING cpfPessoa, nomePessoa, emailPessoa, dataNascimentoPessoa, EnderecoIdEndereco',
      [novaSenha, cpf]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}