// loginRoutes.js - Versão Otimizada

const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// 💡 Rota que será acionada quando o navegador acessar '/login'
// (assumindo que o router é montado com app.use('/login', ...))
router.get('/', loginController.abrirTelaLogin); 

// Rotas de autenticação (mantidas)
router.get('/abrirTelaLogin', loginController.abrirTelaLogin); // Mantida para o caso de precisar da rota completa
router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/verificaSeUsuarioEstaLogado', loginController.verificaSeUsuarioEstaLogado);

// Rotas de CRUD (listar, criar, obter...) - Ajuste a rota base para evitar conflito
router.get('/lista', loginController.listarPessoas); // Alterado de '/' para '/lista'
router.post('/cadastro', loginController.criarPessoa); // Ajustado para ser mais claro
router.get('/:id', loginController.obterPessoa);

module.exports = router;