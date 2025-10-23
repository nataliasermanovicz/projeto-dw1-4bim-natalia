//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPagamentoHasFormaPagamento = (req, res) => {
  console.log('pagamentoHasFormaPagamento - Rota /abrirCrudPagamentoHasFormaPagamento');
  res.sendFile(path.join(__dirname, '../../html/pagamentoHasFormaPagamento/pagamentoHasFormaPagamento.html'));
}

 

// Lista todos os registros de PagamentoHasFormaPagamento
exports.listarPagamentoHasFormaPagamento = async (req, res) => {
  try {
    const result = await query('SELECT * FROM PagamentoHasFormaPagamento');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar PagamentoHasFormaPagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


// Busca registros de PagamentoHasFormaPagamento por PagamentoIdPedido
exports.obterPagamentoHasFormaPagamentoPorPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM PagamentoHasFormaPagamento WHERE PagamentoIdPedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para este pedido' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter PagamentoHasFormaPagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor - PagamentoHasFormaPagamento' });
  }
}
