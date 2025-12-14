const { query } = require('../database');
const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend-Gerente/pessoa/pessoa.html'));
} 

// Listar
exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pessoa ORDER BY cpfPessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}

// CRIAR PESSOA
exports.criarPessoa = async (req, res) => {
  try {
    const { 
        cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco,
        isFuncionario, salario, CargosIdCargo,
        isCliente, rendaCliente, dataDeCadastroCliente
    } = req.body;

    if (!cpfPessoa || !nomePessoa || !emailPessoa || !senhaPessoa) {
      return res.status(400).json({ error: 'CPF, nome, email e senha são obrigatórios' });
    }

    // Tratamento de tipos para evitar erro de banco
    const dataNasc = dataNascimentoPessoa || null;
    const endereco = EnderecoIdEndereco ? parseInt(EnderecoIdEndereco) : null;

    // 1. Insere Pessoa
    await query(
      'INSERT INTO pessoa (cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco) VALUES ($1, $2, $3, $4, $5, $6)',
      [cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNasc, endereco]
    );

    // 2. Se marcado como Funcionário, insere
    if (isFuncionario === true || isFuncionario === 'true') {
        const sal = salario ? parseFloat(salario) : 0;
        const cargo = CargosIdCargo ? parseInt(CargosIdCargo) : null;
        await query(
            'INSERT INTO funcionario (PessoaCpfPessoa, salario, CargosIdCargo) VALUES ($1, $2, $3)',
            [cpfPessoa, sal, cargo]
        );
    }

    // 3. Se marcado como Cliente, insere
    if (isCliente === true || isCliente === 'true') {
        const renda = rendaCliente ? parseFloat(rendaCliente) : 0;
        const dataCad = dataDeCadastroCliente || new Date();
        await query(
            'INSERT INTO cliente (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente) VALUES ($1, $2, $3)',
            [cpfPessoa, renda, dataCad]
        );
    }

    res.status(201).json({ message: 'Pessoa criada com sucesso', cpfPessoa });

  } catch (error) {
    console.error('Erro ao criar:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'CPF ou Email já cadastrados.' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// OBTER
exports.obterPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;
    if (!cpf) return res.status(400).json({ error: 'CPF obrigatório' });

    const sql = `
        SELECT 
            p.*,
            f.salario, f.CargosIdCargo, 
            c.rendaCliente, c.dataDeCadastroCliente
        FROM Pessoa p
        LEFT JOIN Funcionario f ON p.cpfPessoa = f.PessoaCpfPessoa
        LEFT JOIN Cliente c ON p.cpfPessoa = c.PessoaCpfPessoa
        WHERE p.cpfPessoa = $1
    `;
    const result = await query(sql, [cpf]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}

// ATUALIZAR (Correções aplicadas aqui)
exports.atualizarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;
    const { 
        nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco,
        isFuncionario, salario, CargosIdCargo,
        isCliente, rendaCliente, dataDeCadastroCliente
    } = req.body;

    console.log(`Atualizando CPF ${cpf}. Funcionario: ${isFuncionario}, Cliente: ${isCliente}`);

    const dataNasc = dataNascimentoPessoa || null;
    const endereco = EnderecoIdEndereco ? parseInt(EnderecoIdEndereco) : null;

    // 1. Atualiza dados básicos da Pessoa
    const updatePessoa = await query(
      'UPDATE pessoa SET nomePessoa = $1, emailPessoa = $2, senhaPessoa = $3, dataNascimentoPessoa = $4, EnderecoIdEndereco = $5 WHERE cpfPessoa = $6 RETURNING *',
      [nomePessoa, emailPessoa, senhaPessoa, dataNasc, endereco, cpf]
    );

    if (updatePessoa.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    // 2. GERENCIAR FUNCIONÁRIO
    if (isFuncionario === true || isFuncionario === 'true') {
        const sal = salario ? parseFloat(salario) : 0;
        const cargo = CargosIdCargo ? parseInt(CargosIdCargo) : null;

        // Tenta atualizar
        const updateFunc = await query(
            'UPDATE funcionario SET salario = $1, CargosIdCargo = $2 WHERE PessoaCpfPessoa = $3 RETURNING *',
            [sal, cargo, cpf]
        );
        
        // Se não atualizou nada, insere
        if (updateFunc.rowCount === 0) {
            console.log('Inserindo novo funcionário...');
            await query(
                'INSERT INTO funcionario (PessoaCpfPessoa, salario, CargosIdCargo) VALUES ($1, $2, $3)',
                [cpf, sal, cargo]
            );
        }
    } else {
        // Se desmarcou, DELETA
        console.log('Removendo funcionário...');
        await query('DELETE FROM funcionario WHERE PessoaCpfPessoa = $1', [cpf]);
    }

    // 3. GERENCIAR CLIENTE
    if (isCliente === true || isCliente === 'true') {
        const renda = rendaCliente ? parseFloat(rendaCliente) : 0;
        const dataCad = dataDeCadastroCliente || new Date();

        // Tenta atualizar
        const updateCli = await query(
            'UPDATE cliente SET rendaCliente = $1, dataDeCadastroCliente = $2 WHERE PessoaCpfPessoa = $3 RETURNING *',
            [renda, dataCad, cpf]
        );
        
        // Se não atualizou, insere
        if (updateCli.rowCount === 0) {
            console.log('Inserindo novo cliente...');
            await query(
                'INSERT INTO cliente (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente) VALUES ($1, $2, $3)',
                [cpf, renda, dataCad]
            );
        }
    } else {
        // Se desmarcou, DELETA
        console.log('Removendo cliente...');
        await query('DELETE FROM cliente WHERE PessoaCpfPessoa = $1', [cpf]);
    }

    res.json(updatePessoa.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar:', error);
    // Erro de FK ao tentar deletar Funcionario/Cliente que tem Vendas/Pedidos
    if (error.code === '23503') return res.status(400).json({ 
        error: 'Atenção: Os dados da Pessoa foram salvos, mas não foi possível remover o perfil de Cliente/Funcionário pois existem Pedidos vinculados a ele.' 
    });
    res.status(500).json({ error: 'Erro interno' });
  }
}

// DELETAR
exports.deletarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;

    await query('DELETE FROM funcionario WHERE PessoaCpfPessoa = $1', [cpf]);
    await query('DELETE FROM cliente WHERE PessoaCpfPessoa = $1', [cpf]);
    
    const result = await query('DELETE FROM pessoa WHERE cpfPessoa = $1 RETURNING cpfPessoa', [cpf]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Não é possível deletar esta pessoa pois ela possui Pedidos ou outros vínculos.' });
    res.status(500).json({ error: 'Erro interno' });
  }
}