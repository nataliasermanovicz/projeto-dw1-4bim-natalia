const express = require('express');
const router = express.Router();

const pedidoHasProdutoController = require('../controllers/PedidoHasProdutoController');

// CRUD de PedidoHasProduto
router.get('/', pedidoHasProdutoController.listarPedidoHasProduto);
router.get('/:id', pedidoHasProdutoController.obterPedidoHasProdutoPorPedido);
// Adicione aqui POST, PUT e DELETE se existirem no controller

router.post('/', pedidoHasProdutoController.adicionarProdutoAoPedido);

module.exports = router;
