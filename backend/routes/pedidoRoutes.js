const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Middleware de debug
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// CRUD de Pedidos
router.get('/', pedidoController.listarPedido);
router.post('/', pedidoController.criarPedido);
router.post('/criarProximoPedido', pedidoController.criarProximoPedido);

// listar pedidos por cliente (CPF)
router.get('/cliente/:cpf', pedidoController.listarPedidosPorCliente);

// Rotas com parâmetros genéricos
router.get('/:id', pedidoController.obterPedido);
router.delete('/:id', pedidoController.deletarPedido);

module.exports = router;