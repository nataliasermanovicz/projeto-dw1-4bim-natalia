const { query } = require('../database');
const path = require('path');

exports.abrirTelaRelatorioVendas = (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend-Gerente/relatorios/relatorioVendas.html'));
};

exports.gerarRelatorioVendas = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.body;

        if (!dataInicio || !dataFim) {
            return res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
        }

        // SQL Poderoso: Busca Pedido + Nome do Cliente + Valor do Pagamento + Forma de Pagamento
        // Usamos COALESCE para garantir que não venha null se não tiver pagamento ainda
        const sql = `
            SELECT 
                p.idPedido AS id_pedido,
                p.dataDoPedido AS data_pedido,
                pes.nomePessoa AS nome_cliente,
                COALESCE(pag.valorTotalPagamento, 0) AS valor_total,
                STRING_AGG(fp.nomeFormaPagamento, ', ') AS forma_pagamento
            FROM Pedido p
            INNER JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
            INNER JOIN Pessoa pes ON c.PessoaCpfPessoa = pes.cpfPessoa
            LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
            LEFT JOIN PagamentoHasFormaPagamento phf ON pag.PedidoIdPedido = phf.PagamentoIdPedido
            LEFT JOIN FormaDePagamento fp ON phf.FormaPagamentoIdFormaPagamento = fp.idFormaPagamento
            WHERE p.dataDoPedido >= $1 AND p.dataDoPedido <= $2
            GROUP BY p.idPedido, p.dataDoPedido, pes.nomePessoa, pag.valorTotalPagamento
            ORDER BY p.dataDoPedido DESC
        `;

        const result = await query(sql, [dataInicio, dataFim]);

        res.json(result.rows);

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};