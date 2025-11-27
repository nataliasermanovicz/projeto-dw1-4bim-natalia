const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// CRUD de Pagamentos


router.get('/', pagamentoController.listarPagamento);
router.post('/', pagamentoController.criarPagamento);
router.get('/:id', pagamentoController.obterPagamento);
// não tem atualizar pagamento
router.delete('/:id', pagamentoController.deletarPagamento);

module.exports = router;
 