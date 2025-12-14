const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Middleware de debug (Opcional, mas útil)
router.use((req, res, next) => {
    console.log(`[Produto Route] ${req.method} ${req.path}`);
    next();
});

// --- Rota para abrir o HTML (IMPORTANTE: Deve vir PRIMEIRO) ---
router.get('/tela-edicao', produtoController.abrirCrudProduto);

// CRUD de Produtos
router.get('/', produtoController.listarProdutos);       // Listar todos
router.post('/', produtoController.criarProduto);        // Criar novo
router.get('/:id', produtoController.obterProduto);      // Buscar por ID

// =================================================================
// CORREÇÃO: Adicionando a rota PUT que estava faltando
// =================================================================
router.put('/:id', produtoController.atualizarProduto); 

router.delete('/:id', produtoController.deletarProduto); // Deletar

// Rota para imagem (se estiver usando)
router.get('/img/:nome', produtoController.buscarImagem);

module.exports = router;