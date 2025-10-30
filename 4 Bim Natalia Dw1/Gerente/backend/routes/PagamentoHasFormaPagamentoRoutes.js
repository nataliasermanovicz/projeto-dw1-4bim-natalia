const express = require('express');
const router = express.Router();
const PagamentoHasFormaPagamentoController = require('../controllers/PagamentoHasFormaPagamentoController');

// =====================================
// ROTAS - PagamentoHasFormaPagamento
// =====================================

// Abre o CRUD (envia o HTML da tela)
router.get(
  '/abrirCrudPagamentoHasFormaPagamento',
  PagamentoHasFormaPagamentoController.abrirCrudPagamentoHasFormaPagamento
);

// Lista todos os registros
router.get(
  '/',
  PagamentoHasFormaPagamentoController.listarPagamentoHasFormaPagamento
);

// Busca registros pelo ID do pedido (PagamentoIdPedido)
router.get(
  '/:id',
  PagamentoHasFormaPagamentoController.obterPagamentoHasFormaPagamentoPorPedido
);

module.exports = router;
