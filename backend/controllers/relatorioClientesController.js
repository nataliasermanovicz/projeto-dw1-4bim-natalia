const { query } = require('../database');
const path = require('path');

exports.abrirTelaRelatorioClientes = (req, res) => {
    // ATENÇÃO: Caminho apontando para a pasta 'relatorios' (plural)
    res.sendFile(path.join(__dirname, '../../frontend-Gerente/relatorios/relatorioClientes.html'));
};

exports.gerarRelatorioClientes = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.body;

        if (!dataInicio || !dataFim) {
            return res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
        }

        const sql = `
            SELECT 
                p.cpfPessoa,
                p.nomePessoa,
                p.emailPessoa,
                c.dataDeCadastroCliente,
                COALESCE(c.rendaCliente, 0) as rendaCliente
            FROM Cliente c
            INNER JOIN Pessoa p ON c.PessoaCpfPessoa = p.cpfPessoa
            WHERE c.dataDeCadastroCliente >= $1 AND c.dataDeCadastroCliente <= $2
            ORDER BY c.dataDeCadastroCliente DESC
        `;

        const result = await query(sql, [dataInicio, dataFim]);

        res.json(result.rows);

    } catch (error) {
        console.error('Erro ao gerar relatório de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};