const express = require('express');
const router = express.Router();
const pedidoHasProdutoController = require('../controllers/PedidoHasProdutoController');

// CRUD de PedidoHasProduto
router.get('/', pedidoHasProdutoController.listarPedidoHasProduto);

// Busca itens de um pedido específico
router.get('/:id', pedidoHasProdutoController.obterPedidoHasProdutoPorPedido);

// Adicionar novo item
router.post('/', pedidoHasProdutoController.adicionarProdutoAoPedido);

// Atualizar item (PUT /:idPedido/:idProduto)
router.put('/:idPedido/:idProduto', pedidoHasProdutoController.atualizarItemDoPedido);

// Deletar item (DELETE /:idPedido/:idProduto)
router.delete('/:idPedido/:idProduto', pedidoHasProdutoController.deletarItemDoPedido);

module.exports = router;