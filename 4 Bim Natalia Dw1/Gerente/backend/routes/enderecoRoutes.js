const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');

// CRUD de Enderecos

router.get('/abrirCrudEndereco', enderecoController.abrirCrudEndereco);
router.get('/', enderecoController.listarEnderecos);
router.post('/', enderecoController.criarEndereco);
router.get('/:id', enderecoController.obterEndereco);
router.put('/:id', enderecoController.atualizarEndereco);
router.delete('/:id', enderecoController.deletarEndereco);

module.exports = router;
