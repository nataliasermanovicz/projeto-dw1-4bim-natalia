//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPagamento = (req, res) => {
//  console.log('pagamentoController - Rota /abrirCrudPagamento - abrir o crudPagamento');
  res.sendFile(path.join(__dirname, '../../html/pagamento/pagamento.html'));
} 

exports.listarPagamento = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento ORDER BY PedidoIdPedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPagamento = async (req, res) => {
  try {
    const { PedidoIdPedido, dataPagamento, valorTotalPagamento } = req.body;

    // Validação básica
    if (!PedidoIdPedido ) {
      return res.status(400).json({
        error: 'ID é obrigatório'
      });
    }


    const result = await query(
      'INSERT INTO pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES ($1, $2, $3) RETURNING *',
      [PedidoIdPedido, dataPagamento, valorTotalPagamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);


    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterPagamento = async (req, res) => {
  try {
    const id = req.params.id; // ID é string

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pagamento WHERE PedidoIdPedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPagamento = async (req, res) => {
  try {
    const id = req.params.id;
    const { dataPagamento, valorTotalPagamento } = req.body;


    // Verifica se a pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE PedidoIdPedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Atualiza a pagamento
    const updateResult = await query(
      'UPDATE pagamento SET dataPagamento = $1, valorTotalPagamento = $2 WHERE PedidoIdPedido = $3 RETURNING *',
      [dataPagamento, valorTotalPagamento, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);


    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPagamento = async (req, res) => {
  try {
    const id = req.params.id;
    // Verifica se a pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE PedidoIdPedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Deleta a pagamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pagamento WHERE PedidoIdPedido = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
