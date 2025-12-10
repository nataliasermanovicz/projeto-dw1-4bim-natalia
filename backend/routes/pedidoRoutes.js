const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Middleware de debug
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// --- Rota para abrir o HTML (IMPORTANTE: Deve vir PRIMEIRO) ---
// Isso garante que o servidor não confunda "tela-edicao" com um ID numérico
router.get('/tela-edicao', pedidoController.abrirCrudPedidos);

// CRUD de Pedidos (Listar e Criar)
router.get('/', pedidoController.listarPedido);
router.post('/', pedidoController.criarPedido);
router.post('/criarProximoPedido', pedidoController.criarProximoPedido);

// Listar pedidos por cliente (CPF)
router.get('/cliente/:cpf', pedidoController.listarPedidosPorCliente);

// --- Rotas com parâmetros genéricos (:id) ---
// Estas devem ficar por último para não interceptar outras rotas
router.get('/:id', pedidoController.obterPedido);
router.put('/:id', pedidoController.atualizarPedido); // Adicionei o PUT caso precise
router.delete('/:id', pedidoController.deletarPedido);

module.exports = router;