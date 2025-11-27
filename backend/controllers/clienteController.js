//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');


exports.listarCliente = async (req, res) => {
  try {
    const result = await query('SELECT * FROM cliente ORDER BY PessoaCpfPessoa');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarCliente = async (req, res) => {
  //  console.log('Criando cliente com dados:', req.body);
  try {
    const { PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente } = req.body;


    const result = await query(
      'INSERT INTO cliente (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente) VALUES ($1, $2, $3) RETURNING *',
      [PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);


    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCliente = async (req, res) => {
  // console.log('Obtendo cliente com ID:', req.params.id);

  try {
    const id = req.params.id; // CPF é string

    if (!id) {
      return res.status(400).json({ error: 'ID do cliente (CPF) é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM cliente WHERE PessoaCpfPessoa = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCliente = async (req, res) => {
  console.log('Atualizando cliente com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = req.params.id; // CPF é string

    const { rendaCliente, dataDeCadastroCliente } = req.body;
    console.log('ID do cliente a ser atualizado:' + id + ' Dados recebidos:' + rendaCliente + ' - ' + dataDeCadastroCliente);

    // Verifica se a cliente existe
    const existingPersonResult = await query(
      'SELECT * FROM cliente WHERE PessoaCpfPessoa = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Atualiza a cliente
    const updateResult = await query(
      'UPDATE cliente SET rendaCliente = $1, dataDeCadastroCliente = $2 WHERE PessoaCpfPessoa = $3 RETURNING *',
      [rendaCliente, dataDeCadastroCliente, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCliente = async (req, res) => {
  try {
    const id = req.params.id; // CPF é string
    // Verifica se a cliente existe
    const existingPersonResult = await query(
      'SELECT * FROM cliente WHERE PessoaCpfPessoa = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Deleta a cliente (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM cliente WHERE PessoaCpfPessoa = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar cliente com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
