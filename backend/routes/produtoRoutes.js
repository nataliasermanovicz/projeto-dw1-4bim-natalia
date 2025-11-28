const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// CRUD de Produtos

router.get('/', produtoController.listarProdutos);
router.post('/', produtoController.criarProduto);
router.get('/:id', produtoController.obterProduto);
// não tem atualizar produto
router.delete('/:id', produtoController.deletarProduto);
//router.get('/img/:nome', produtoController.buscarImagem);
module.exports = router;
 
router.get('/', produtoController.abrirProduto);