//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPedidoHasProduto = (req, res) => {
  console.log('pedidoHasProduto - Rota /abrirCrudPedidoHasProduto');
  res.sendFile(path.join(__dirname, '../../html/pedidoHasProduto/pedidoHasProduto.html'));
}



// Lista todos os registros de PedidoHasProduto
exports.listarPedidoHasProduto = async (req, res) => {
  try {
    const result = await query('SELECT * FROM PedidoHasProduto');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar PedidoHasProduto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


// Busca registros de PedidoHasProduto por PedidoIdPedido
exports.obterPedidoHasProdutoPorPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM PedidoHasProduto WHERE PedidoIdPedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para este pedido' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter PedidoHasProduto:', error);
    res.status(500).json({ error: 'Erro interno do servidor - PedidoHasProduto' });
  }
}
