const express = require('express');
const router = express.Router();
const relatorioVendasController = require('../controllers/relatorioVendasController');

// Rota para abrir a tela HTML
router.get('/vendas', relatorioVendasController.abrirTelaRelatorioVendas);

// Rota POST para processar a busca (enviamos datas no body)
router.post('/vendas/gerar', relatorioVendasController.gerarRelatorioVendas);

module.exports = router;