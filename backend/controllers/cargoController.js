//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudCargo = (req, res) => {
  console.log('cargoController - Rota /abrirCrudCargo - abrir o crudCargo');
  res.sendFile(path.join(__dirname, '../../frontend-Gerente/cargo/cargo.html'));
}

exports.listarCargos = async (req, res) => {
  console.log("rota para listar cargos");
  try {
    const result = await query('SELECT * FROM cargo ORDER BY idCargo');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar questoes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}



exports.criarCargo = async (req, res) => {
  try {
    const { idCargo, nomecargo } = req.body;

    // Validação
    if (!nomecargo) {
      return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
    }

    let result;
    
    // VERIFICAÇÃO INTELIGENTE:
    // Se o ID foi fornecido e não é vazio, fazemos INSERT manual do ID.
    if (idCargo && String(idCargo).trim() !== '') {
        console.log(`Criando cargo com ID Manual: ${idCargo}`);
        result = await query(
            'INSERT INTO cargo (idCargo, nomecargo) VALUES ($1, $2) RETURNING *',
            [idCargo, nomecargo]
        );
    } else {
        // Se não tem ID, fazemos INSERT normal e o banco gera o Serial (Auto-Increment)
        console.log('Criando cargo com ID Automático');
        result = await query(
            'INSERT INTO cargo (nomecargo) VALUES ($1) RETURNING *',
            [nomecargo]
        );
    }

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar cargo:', error);

    // Erro 23505 = Chave duplicada (se tentar criar um ID que já existe)
    if (error.code === '23505') {
        return res.status(400).json({ error: 'Este ID de cargo já existe.' });
    }
    
    // Erro 23502 = Violação de Not Null (geralmente nome vazio ou ID null forçado)
    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos pelo sistema.' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM cargo WHERE idCargo = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nomecargo } = req.body;

   
    // Verifica se a cargo existe
    const existingPersonResult = await query(
      'SELECT * FROM cargo WHERE idCargo = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nomecargo: nomecargo !== undefined ? nomecargo : currentPerson.nomecargo,
    };

    // Atualiza a cargo
    const updateResult = await query(
      'UPDATE cargo SET nomecargo = $1 WHERE idCargo = $2 RETURNING *',
      [updatedFields.nomecargo, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Tenta deletar
    const result = await query('DELETE FROM cargo WHERE idCargo = $1 RETURNING idCargo', [id]);

    if (result.rows.length === 0) {
      // Se não retornou linha, é porque o ID não existia
      return res.status(404).json({ error: 'Cargo não encontrado para exclusão' });
    }

    // Sucesso (No Content)
    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar cargo:', error);

    // TRATAMENTO ESPECÍFICO PARA ERRO DE CHAVE ESTRANGEIRA (FK)
    // Isso acontece se você tentar apagar um Cargo que tem Funcionários
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível excluir este cargo pois existem funcionários vinculados a ele.'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

