//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudEndereco = (req, res) => {
//  console.log('enderecoController - Rota /abrirCrudEndereco - abrir o crudEndereco');
  res.sendFile(path.join(__dirname, '../../html/endereco/endereco.html'));
} //

exports.listarEnderecos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM endereco ORDER BY idEndereco');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar enderecos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarEndereco = async (req, res) => {
    console.log('Criando endereco com dados:', req.body);
  try {
    const { idEndereco, logradouro, numero, referencia, cep, CidadeIdCidade} = req.body;

   // console.log('Dados recebidos:', { idEndereco, logradouro, numero, referencia, cep, CidadeIdCidade });

    // Validação básica
    if (!logradouro || !numero || !CidadeIdCidade || !cep) {
      return res.status(400).json({
        error: 'logradouro, numero e cep são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO endereco (idEndereco, logradouro, numero, referencia, cep, CidadeIdCidade) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [idEndereco, logradouro, numero, referencia,cep, CidadeIdCidade]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar endereco:', error);


    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}



exports.obterEndereco = async (req, res) => {
  console.log('enderecoController -> obterEndereco com ID:', req.params.id);

  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM endereco WHERE idEndereco = $1',
      [id]
    );

    console.log('Resultado do SELECT:', result.rows); // Verifica se está retornando algo

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Endereco não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter endereco:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarEndereco = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { logradouro, numero, referencia, cep, CidadeIdCidade } = req.body;

   
    // Verifica se a endereco existe
    const existingPersonResult = await query(
      'SELECT * FROM endereco WHERE idEndereco = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Endereco não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      logradouro: logradouro !== undefined ? logradouro : currentPerson.logradouro,
      numero: numero !== undefined ? numero : currentPerson.numero,
      referencia: referencia !== undefined ? referencia : currentPerson.referencia,
      cep: cep !== undefined ? cep : currentPerson.cep,
      CidadeIdCidade: CidadeIdCidade !== undefined ? CidadeIdCidade : currentPerson.CidadeIdCidade  
    };

    // Atualiza a endereco
    const updateResult = await query(
      'UPDATE endereco SET logradouro = $1, numero = $2, referencia = $3, cep=$4  WHERE idEndereco = $5 RETURNING *',
      [updatedFields.logradouro, updatedFields.numero, updatedFields.referencia, updatedFields.cep, updatedFields.CidadeIdCidade, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar endereco:', error);



    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarEndereco = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a endereco existe
    const existingPersonResult = await query(
      'SELECT * FROM endereco WHERE idEndereco = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Endereco não encontrada' });
    }

    // Deleta a endereco (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM endereco WHERE idEndereco = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar endereco:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar endereco com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função adicional para buscar endereco por descrição
exports.obterEnderecoPorDescricao = async (req, res) => {
  try {
    const { descricao: descricao } = req.params;

    if (!descricao) {
      return res.status(400).json({ error: 'A descrição é é obrigatória' });
    }

    const result = await query(
      'SELECT * FROM endereco WHERE logradouro = $1',
      [descricao]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Endereco não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter endereco por descrição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

