const { query } = require('../database');
const path = require('path');

// Função para abrir o CRUD
exports.abrirCrudPedidos = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend-Gerente/pedido/pedido.html'));
};

// Listar pedidos (Com Alias para bater com o JS)
exports.listarPedido = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        idpedido AS id_pedido, 
        datadopedido AS data_pedido, 
        clientepessoacpfpessoa AS cliente_pessoa_cpf_pessoa, 
        funcionariopessoacpfpessoa AS funcionario_pessoa_cpf_pessoa 
      FROM pedido 
      ORDER BY idpedido
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarProximoPedido = async (req, res) => {
  try {
    const { datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa } = req.body;
    const result = await query(
      'INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) VALUES ($1, $2, $3) RETURNING idpedido AS id_pedido',
      [datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar próximo pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar pedido
exports.criarPedido = async (req, res) => {
  try {
    const { data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    const result = await query(
      `INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) 
       VALUES ($1, $2, $3) 
       RETURNING 
         idpedido AS id_pedido, 
         datadopedido AS data_pedido, 
         clientepessoacpfpessoa AS cliente_pessoa_cpf_pessoa, 
         funcionariopessoacpfpessoa AS funcionario_pessoa_cpf_pessoa`,
      [data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter pedido por ID (Com Alias)
exports.obterPedido = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (isNaN(id)) return next(); // Pula se não for numero

    const result = await query(
      `SELECT 
         idpedido AS id_pedido, 
         datadopedido AS data_pedido, 
         clientepessoacpfpessoa AS cliente_pessoa_cpf_pessoa, 
         funcionariopessoacpfpessoa AS funcionario_pessoa_cpf_pessoa 
       FROM pedido WHERE idpedido = $1`,
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

// Listar pedidos por cliente (Com Alias)
exports.listarPedidosPorCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const result = await query(`
      SELECT 
        idpedido AS id_pedido, 
        datadopedido AS data_pedido, 
        clientepessoacpfpessoa AS cliente_pessoa_cpf_pessoa, 
        funcionariopessoacpfpessoa AS funcionario_pessoa_cpf_pessoa 
      FROM pedido WHERE clientepessoacpfpessoa = $1 ORDER BY idpedido`, 
      [cpf]
    );
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
    // O JS envia: data_pedido, cliente_pessoa_cpf_pessoa...
    const { data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const updateResult = await query(
      `UPDATE pedido 
       SET datadopedido = $1, clientepessoacpfpessoa = $2, funcionariopessoacpfpessoa = $3 
       WHERE idpedido = $4 
       RETURNING 
         idpedido AS id_pedido, 
         datadopedido AS data_pedido, 
         clientepessoacpfpessoa AS cliente_pessoa_cpf_pessoa, 
         funcionariopessoacpfpessoa AS funcionario_pessoa_cpf_pessoa`,
      [data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa, id]
    );

    if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
    }

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
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const result = await query('DELETE FROM pedido WHERE idpedido = $1 RETURNING idpedido', [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar pedido com itens associados' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};