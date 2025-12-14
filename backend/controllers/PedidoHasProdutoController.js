// Import da conexão com o banco
const { query } = require('../database');
const path = require('path');

// Abre a tela HTML (Rota de UI)
exports.abrirCrudPedidoHasProduto = (req, res) => {
  console.log('pedidoHasProduto - Rota /abrirCrudPedidoHasProduto');
  res.sendFile(path.join(__dirname, '../../html/pedidoHasProduto/pedidoHasProduto.html'));
}

// ==============================================================================
// ADICIONAR ITEM (POST)
// Ajustado para receber as chaves que o pedido.js envia (com underlines)
// ==============================================================================
exports.adicionarProdutoAoPedido = async (req, res) => {
  try {
    // O JS envia: pedido_id_pedido, produto_id_produto, quantidade, preco_unitario
    // O Banco espera: pedidoidpedido, produtoidproduto, quantidade, precounitario
    
    // Mapeamento manual para garantir que funcione independente do nome da var
    const pedidoId = req.body.pedidoidpedido || req.body.pedido_id_pedido;
    const produtoId = req.body.produtoidproduto || req.body.produto_id_produto;
    const qtd = req.body.quantidade;
    const preco = req.body.precounitario || req.body.preco_unitario;

    // Validação simples
    if (!pedidoId || !produtoId) {
        return res.status(400).json({ error: "IDs de Pedido e Produto são obrigatórios." });
    }

    const result = await query(
      'INSERT INTO PedidoHasProduto (pedidoidpedido, produtoidproduto, quantidade, precounitario) VALUES ($1, $2, $3 , $4) RETURNING *',
      [pedidoId, produtoId, qtd, preco]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {    
    console.error('Erro ao adicionar produto ao pedido:', error);
    // Tratamento de erro de chave duplicada (produto já existe no pedido)
    if (error.code === '23505') {
        return res.status(400).json({ error: 'Este produto já foi adicionado a este pedido. Use "Atualizar".' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }   
}

// ==============================================================================
// LISTAR TUDO (GET)
// ==============================================================================
exports.listarPedidoHasProduto = async (req, res) => {
  try {
    const result = await query('SELECT * FROM PedidoHasProduto');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar PedidoHasProduto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ==============================================================================
// OBTER ITENS DE UM PEDIDO ESPECÍFICO (GET /:id)
// *** AQUI ESTAVA O PROBLEMA DE EXIBIÇÃO ***
// Agora fazemos JOIN com Produto e usamos ALIAS (AS) para bater com o JS
// ==============================================================================
exports.obterPedidoHasProdutoPorPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // Query otimizada:
    // 1. JOIN com Produto para pegar o nome
    // 2. AS alias para renomear colunas do banco (minúsculo) para o padrão do JS (com underline)
    const sql = `
        SELECT 
            php.PedidoIdPedido AS pedido_id_pedido,
            php.ProdutoIdProduto AS produto_id_produto,
            php.quantidade,
            php.precoUnitario AS preco_unitario,
            p.nomeProduto AS nome_produto
        FROM PedidoHasProduto php
        INNER JOIN Produto p ON php.ProdutoIdProduto = p.idProduto
        WHERE php.PedidoIdPedido = $1
    `;

    const result = await query(sql, [id]);

    // O frontend espera um array vazio se não tiver itens, não um erro 404
    if (result.rows.length === 0) {
      return res.json([]); 
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter PedidoHasProduto:', error);
    res.status(500).json({ error: 'Erro interno do servidor - PedidoHasProduto' });
  }
}

// Adicionei DELETE e UPDATE caso seu frontend precise no futuro (btnExcluirItem / btnAtualizarItem)
exports.deletarItemDoPedido = async (req, res) => {
    try {
        const { idPedido, idProduto } = req.params;
        await query('DELETE FROM PedidoHasProduto WHERE PedidoIdPedido = $1 AND ProdutoIdProduto = $2', [idPedido, idProduto]);
        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar item' });
    }
}

exports.atualizarItemDoPedido = async (req, res) => {
    try {
        const { idPedido, idProduto } = req.params;
        const { quantidade, preco_unitario } = req.body;
        await query(
            'UPDATE PedidoHasProduto SET quantidade = $1, precoUnitario = $2 WHERE PedidoIdPedido = $3 AND ProdutoIdProduto = $4', 
            [quantidade, preco_unitario, idPedido, idProduto]
        );
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
}