//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudProduto = (req, res) => {
//  console.log('produtoController - Rota /abrirCrudProduto - abrir o crudProduto');
  res.sendFile(path.join(__dirname, '../../html/produto/produto.html'));
} 

exports.listarProdutos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM produto ORDER BY idProduto');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarProduto = async (req, res) => {
  try {
    const { idProduto, nomeProduto, quantidadeEmEstoque, precoUnitario } = req.body;

    // Validação básica
    if (!idProduto || !nomeProduto || !quantidadeEmEstoque || !precoUnitario) {
      return res.status(400).json({
        error: 'ID e nome são obrigatórios'
      });
    }


    const result = await query(
      'INSERT INTO produto (idProduto, nomeProduto, quantidadeEmEstoque, precoUnitario) VALUES ($1, $2, $3, $4) RETURNING *',
      [idProduto, nomeProduto, quantidadeEmEstoque, precoUnitario]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);


    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterProduto = async (req, res) => {
  try {
    const id = req.params.id; // ID é string

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM produto WHERE idProduto = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarProduto = async (req, res) => {
  try {
    const id = req.params.id;
    const { nomeProduto, quantidadeEmEstoque, precoUnitario } = req.body;


    // Verifica se a produto existe
    const existingPersonResult = await query(
      'SELECT * FROM produto WHERE idProduto = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrada' });
    }

    // Atualiza a produto
    const updateResult = await query(
      'UPDATE produto SET nomeProduto = $1, quantidadeEmEstoque = $2, precoUnitario = $3 WHERE idProduto = $4 RETURNING *',
      [nomeProduto, quantidadeEmEstoque, precoUnitario, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);

    // Verifica se é erro de email duplicado
    if (error.code === '23505' && error.constraint === 'produto_quantidadeEmEstoque_key') {
      return res.status(400).json({
        error: 'Email já está em uso por outra produto'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarProduto = async (req, res) => {
  try {
    const id = req.params.id;
    // Verifica se a produto existe
    const existingPersonResult = await query(
      'SELECT * FROM produto WHERE idProduto = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrada' });
    }

    // Deleta a produto (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM produto WHERE idProduto = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar produto:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar produto com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
