//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudFormaDePagamento = (req, res) => {
//  console.log('formadepagamentoController - Rota /abrirCrudFormaDePagamento - abrir o crudFormaDePagamento');
  res.sendFile(path.join(__dirname, '../../frontend-Gerente/forma_pagamento/forma_pagamento.html'));
} 

exports.listarFormaDePagamento = async (req, res) => {
  try {
    const result = await query('SELECT * FROM formadepagamento ORDER BY idFormaPagamento');
    res.json(result.rows);
  } catch (error) { 
    console.error('Erro ao listar formadepagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarFormaDePagamento = async (req, res) => {
  try {
    const { idFormaPagamento, nomeFormaPagamento } = req.body;

    // Validação básica
    if (!idFormaPagamento) {
      return res.status(400).json({
        error: 'ID é obrigatório'
      });
    }


    const result = await query(
      'INSERT INTO formadepagamento (idFormaPagamento, nomeFormaPagamento) VALUES ($1, $2) RETURNING *',
      [idFormaPagamento, nomeFormaPagamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar formadepagamento:', error);


    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id; // ID é string

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM formadepagamento WHERE idFormaPagamento = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FormaDePagamento não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter formadepagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id;
    const { nomeFormaPagamento } = req.body;


    // Verifica se a formadepagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM formadepagamento WHERE idFormaPagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'FormaDePagamento não encontrada' });
    }

    // Atualiza a formadepagamento
    const updateResult = await query(
      'UPDATE formadepagamento SET nomeFormaPagamento = $1 WHERE idFormaPagamento = $2 RETURNING *',
      [nomeFormaPagamento, quantidadeEmEstoque, precoUnitario, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar formadepagamento:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id;
    // Verifica se a formadepagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM formadepagamento WHERE idFormaPagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'FormaDePagamento não encontrada' });
    }

    // Deleta a formadepagamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM formadepagamento WHERE idFormaPagamento = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar formadepagamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar formadepagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
