const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// CRUD de Pedidos


router.get('/', pedidoController.listarPedido);
router.post('/', pedidoController.criarPedido);
router.get('/:id', pedidoController.obterPedido);
// não tem atualizar pedido
router.delete('/:id', pedidoController.deletarPedido);

module.exports = router;
