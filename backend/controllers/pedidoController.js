// import do query para PostgreSQL
const { query } = require('../database');
const path = require('path');

// Função para abrir o CRUD de Pedidos
exports.abrirCrudPedidos = (req, res) => {
  res.sendFile(path.join(__dirname, '../../html/pedidos/pedidos.html'));
};

// Listar pedidos
exports.listarPedido = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedidos ORDER BY idPedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar pedido
exports.criarPedido = async (req, res) => {
  try {
    const { idPedido, dataDoPedido, ClientePessoaIdPessoa, FuncionarioPessoaIdPessoa } = req.body;

    // Validação básica
    if (!idPedido || !ClientePessoaIdPessoa) {
      return res.status(400).json({ error: 'ID e cliente são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO pedidos (idPedido, dataDoPedido, ClientePessoaIdPessoa, FuncionarioPessoaIdPessoa) VALUES ($1, $2, $3, $4) RETURNING *',
      [idPedido, dataDoPedido, ClientePessoaIdPessoa, FuncionarioPessoaIdPessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);

    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter pedido por ID
exports.obterPedido = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pedidos WHERE idPedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar pedido
exports.atualizarPedido = async (req, res) => {
  try {
    const id = req.params.id;
    const { dataDoPedido, ClientePessoaIdPessoa, FuncionarioPessoaIdPessoa } = req.body;

    const existingResult = await query(
      'SELECT * FROM pedidos WHERE idPedido = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const updateResult = await query(
      'UPDATE pedidos SET dataDoPedido = $1, ClientePessoaIdPessoa = $2, FuncionarioPessoaIdPessoa = $3 WHERE idPedido = $4 RETURNING *',
      [dataDoPedido, ClientePessoaIdPessoa, FuncionarioPessoaIdPessoa, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar pedido
exports.deletarPedido = async (req, res) => {
  try {
    const id = req.params.id;

    const existingResult = await query(
      'SELECT * FROM pedidos WHERE idPedido = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await query('DELETE FROM pedidos WHERE idPedido = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pedido com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
