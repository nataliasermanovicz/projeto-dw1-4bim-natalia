const express = require('express');
const router = express.Router();
const FormaDePagamentoController = require('../controllers/FormaDePagamentoController');

// CRUD de FormaDePagamentos

router.get('/tela-edicao',
  FormaDePagamentoController.abrirCrudFormaDePagamento
);
router.get('/', FormaDePagamentoController.listarFormaDePagamento);
router.post('/', FormaDePagamentoController.criarFormaDePagamento);
router.get('/:id', FormaDePagamentoController.obterFormaDePagamento);
// não tem atualizar FormaDePagamento
router.delete('/:id', FormaDePagamentoController.deletarFormaDePagamento);

module.exports = router; 
  