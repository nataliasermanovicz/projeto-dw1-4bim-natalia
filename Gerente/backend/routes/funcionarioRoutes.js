const express = require('express');
const router = express.Router();

const funcionarioController = require('../controllers/funcionarioController');

// CRUD de Funcionarios
router.get('/', funcionarioController.listarFuncionarios);
router.post('/', funcionarioController.criarFuncionarios);
router.get('/:cpf', funcionarioController.obterFuncionarios);
router.put('/:cpf', funcionarioController.atualizarFuncionarios);
router.delete('/:cpf', funcionarioController.deletarFuncionarios);

module.exports = router;
