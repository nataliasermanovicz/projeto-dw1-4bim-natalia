const express = require('express');
const router = express.Router();
const relatorioClientesController = require('../controllers/relatorioClientesController');

// Rota para abrir o HTML
router.get('/clientes', relatorioClientesController.abrirTelaRelatorioClientes);

// Rota POST para buscar os dados
router.post('/clientes/gerar', relatorioClientesController.gerarRelatorioClientes);

module.exports = router;