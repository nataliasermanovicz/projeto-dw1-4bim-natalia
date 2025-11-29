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
    const result = await query('SELECT * FROM pedido ORDER BY idpedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar pedido
exports.criarPedido = async (req, res) => {
  try {
    // Log para ajudar a debugar os pedidos que chegam
    console.log('PedidoController.criarPedido - corpo recebido:', req.body);

    const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;

    // Validação básica
    if (!ClientePessoaCpfPessoa) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }

    const result = await query(
      'INSERT INTO pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES ($1, $2, $3) RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa]
    );

    console.log('Pedido criado:', result.rows[0]);
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
      'SELECT * FROM pedido WHERE idpedido = $1',
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

// Listar pedidos por CPF de cliente
exports.listarPedidosPorCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório' });

    const result = await query('SELECT * FROM pedido WHERE clientepessoacpfpessoa = $1 ORDER BY idpedido', [cpf]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos por cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar pedido
exports.atualizarPedido = async (req, res) => {
  try {
    const id = req.params.id;
    const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;

    const existingResult = await query(
      'SELECT * FROM pedido WHERE idpedido = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const updateResult = await query(
      'UPDATE pedido SET datadopedido = $1, clientepessoacpfpessoa = $2, funcionariopessoacpfpessoa = $3 WHERE idpedido = $4 RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa, id]
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
      'SELECT * FROM pedido WHERE idpedido = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await query('DELETE FROM pedido WHERE idpedido = $1', [id]);

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
