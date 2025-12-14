const { query } = require('../database');
const path = require('path');

exports.abrirCrudFormaDePagamento = (req, res) => {
  // CORREÇÃO AQUI: Adicionado o underline no nome da pasta e do arquivo
  // De: .../formadepagamento/formadepagamento.html
  // Para: .../forma_pagamento/forma_pagamento.html
  res.sendFile(path.join(__dirname, '../../frontend-Gerente/forma_pagamento/forma_pagamento.html'));
} 

exports.listarFormaDePagamento = async (req, res) => {
  try {
    const result = await query('SELECT * FROM formadepagamento ORDER BY idFormaPagamento');
    res.json(result.rows);
  } catch (error) { 
    console.error('Erro ao listar formadepagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarFormaDePagamento = async (req, res) => {
  try {
    const { idFormaPagamento, nomeFormaPagamento } = req.body;

    if (!nomeFormaPagamento) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    let result;
    
    if (idFormaPagamento && String(idFormaPagamento).trim() !== '') {
        result = await query(
            'INSERT INTO formadepagamento (idFormaPagamento, nomeFormaPagamento) VALUES ($1, $2) RETURNING *',
            [idFormaPagamento, nomeFormaPagamento]
        );
    } else {
        result = await query(
            'INSERT INTO formadepagamento (nomeFormaPagamento) VALUES ($1) RETURNING *',
            [nomeFormaPagamento]
        );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar formadepagamento:', error);
    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const result = await query('SELECT * FROM formadepagamento WHERE idFormaPagamento = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FormaDePagamento não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id;
    const { nomeFormaPagamento } = req.body;

    const existingResult = await query('SELECT * FROM formadepagamento WHERE idFormaPagamento = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const updateResult = await query(
      'UPDATE formadepagamento SET nomeFormaPagamento = $1 WHERE idFormaPagamento = $2 RETURNING *',
      [nomeFormaPagamento, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarFormaDePagamento = async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await query('DELETE FROM formadepagamento WHERE idFormaPagamento = $1 RETURNING idFormaPagamento', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar pois existem pagamentos usando esta forma.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}