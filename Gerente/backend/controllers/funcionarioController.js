//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudFuncionario = (req, res) => {
//  console.log('funcionarioController - Rota /abrirCrudFuncionario - abrir o crudFuncionario');
  res.sendFile(path.join(__dirname, '../../html/funcionario/funcionario.html'));
} 

exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query('SELECT * FROM funcionario ORDER BY PessoaCpfPessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarFuncionarios = async (req, res) => {
  try {
    const { PessoaCpfPessoa, salario, CargosIdCargo } = req.body;

    // Validação básica
    if (!PessoaCpfPessoa || !salario || !CargosIdCargo) {
      return res.status(400).json({
        error: 'CPF, salario e cargo são obrigatórios'
      });
    }


    const result = await query(
      'INSERT INTO funcionario (PessoaCpfPessoa, salario, CargosIdCargo) VALUES ($1, $2, $3) RETURNING *',
      [PessoaCpfPessoa, salario, CargosIdCargo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionario:', error);



    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterFuncionarios = async (req, res) => {
  try {
    const cpf = req.params.cpf; // CPF é string

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM funcionario WHERE PessoaCpfPessoa = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarFuncionarios = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const { salario, CargosIdCargo } = req.body;

    // Verifica se a funcionario existe
    const existingPersonResult = await query(
      'SELECT * FROM funcionario WHERE PessoaCpfPessoa = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario não encontrada' });
    }

    // Atualiza a funcionario
    const updateResult = await query(
      'UPDATE funcionario SET salario = $1, CargosIdCargo = $2 WHERE PessoaCpfPessoa = $3 RETURNING *',
      [salario, CargosIdCargo, cpf]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionario:', error);


    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarFuncionarios = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    // Verifica se a funcionario existe
    const existingPersonResult = await query(
      'SELECT * FROM funcionario WHERE PessoaCpfPessoa = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario não encontrada' });
    }

    // Deleta a funcionario (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM funcionario WHERE PessoaCpfPessoa = $1',
      [cpf]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionario:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar funcionario com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
