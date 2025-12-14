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
// Adicione um log para verificar a query e os parâmetros
// Substitua APENAS a função exports.criarProximoPedido por esta:

exports.criarProximoPedido = async (req, res) => {
  console.log('Criando pedido completo:', req.body);

  try {
    const { 
        datadopedido, 
        clientepessoacpfpessoa, 
        funcionariopessoacpfpessoa,
        valorTotal,        // Vem do frontend agora
        idFormaPagamento   // Vem do frontend agora (1 ou 2)
    } = req.body;

    // 1. Garante que o Cliente existe
    const checkCliente = await query('SELECT * FROM Cliente WHERE pessoacpfpessoa = $1', [clientepessoacpfpessoa]);
    if (checkCliente.rows.length === 0) {
        await query('INSERT INTO Cliente (pessoacpfpessoa) VALUES ($1)', [clientepessoacpfpessoa]);
    }

    // 2. Garante/Verifica Funcionário
    let cpfFuncionario = funcionariopessoacpfpessoa;
    if (cpfFuncionario === '11111111111') {
         const checkFunc = await query('SELECT * FROM Funcionario WHERE pessoacpfpessoa = $1', [cpfFuncionario]);
         if (checkFunc.rows.length === 0) cpfFuncionario = null; 
    }

    // 3. INSERIR PEDIDO
    const sqlPedido = 'INSERT INTO Pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) VALUES ($1, $2, $3) RETURNING idpedido';
    const resultPedido = await query(sqlPedido, [datadopedido, clientepessoacpfpessoa, cpfFuncionario]);
    const idPedidoGerado = resultPedido.rows[0].idpedido;

    // =================================================================
    // 4. INSERIR PAGAMENTO COM A FORMA CORRETA
    // =================================================================
    
    // Se o valorTotal vier undefined, usa 0
    const valorFinal = valorTotal ? parseFloat(valorTotal) : 0; 
    
    // Se idFormaPagamento vier undefined, usa 2 (PIX) como fallback, mas o ideal é vir do front
    const formaEscolhida = idFormaPagamento ? parseInt(idFormaPagamento) : 2; 

    // A. Inserir na tabela Pagamento (Tabela Pai)
    await query(
        'INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES ($1, NOW(), $2)',
        [idPedidoGerado, valorFinal]
    );

    // B. Inserir na tabela de Ligação (Onde define se é Cartão ou PIX)
    await query(
        'INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago) VALUES ($1, $2, $3)',
        [idPedidoGerado, formaEscolhida, valorFinal]
    );

    console.log(`Pedido ${idPedidoGerado} criado. Pagamento: R$${valorFinal}, Forma ID: ${formaEscolhida}`);

    // Retorna o ID com alias para o frontend não se perder
    res.status(201).json({ id_pedido: idPedidoGerado });

  } catch (error) {
    console.error('Erro ao criar pedido completo:', error);
    res.status(500).json({ error: 'Erro no servidor', detail: error.message });
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

exports.listarPedidosPorCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    
    // Fazemos LEFT JOIN para trazer o pedido mesmo se o pagamento não tiver sido gravado ainda
    const sql = `
      SELECT 
        p.idpedido AS id_pedido, 
        p.datadopedido AS data_pedido, 
        p.clientepessoacpfpessoa AS cliente_cpf,
        fp.nomeformapagamento AS nome_pagamento,   -- Trazemos o nome (Cartão/PIX)
        pag.valortotalpagamento AS valor_total     -- Trazemos o valor gravado no pagamento
      FROM Pedido p
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      LEFT JOIN PagamentoHasFormaPagamento phf ON pag.PedidoIdPedido = phf.PagamentoIdPedido
      LEFT JOIN FormaDePagamento fp ON phf.FormaPagamentoIdFormaPagamento = fp.idFormaPagamento
      WHERE p.clientepessoacpfpessoa = $1
      ORDER BY p.idpedido DESC
    `;

    const result = await query(sql, [cpf]);
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
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // =========================================================================
    // LIMPEZA EM CASCATA MANUAL
    // Antes de deletar o pedido, deletamos tudo que depende dele.
    // =========================================================================

    // 1. Deletar PagamentoHasFormaPagamento (Filha de Pagamento)
    // Precisamos achar o pagamento primeiro para deletar suas formas
    await query(`
        DELETE FROM PagamentoHasFormaPagamento 
        WHERE PagamentoIdPedido IN (SELECT PedidoIdPedido FROM Pagamento WHERE PedidoIdPedido = $1)
    `, [id]);

    // 2. Deletar Pagamento (Filha de Pedido)
    await query('DELETE FROM Pagamento WHERE PedidoIdPedido = $1', [id]);

    // 3. Deletar Itens do Pedido (Filha de Pedido - caso tenha sobrado algum)
    await query('DELETE FROM PedidoHasProduto WHERE PedidoIdPedido = $1', [id]);

    // =========================================================================
    // DELETAR O PEDIDO (Agora está livre)
    // =========================================================================
    const result = await query('DELETE FROM pedido WHERE idpedido = $1 RETURNING idpedido', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar este pedido pois ainda existem registros dependentes.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};