
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const db = require('./database');
const path = require('path');

const HOST = 'localhost';
const PORT_FIXA = 3001;


// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../')));
app.use('/imgs', express.static(path.join(__dirname, '../imgs')));
app.use('/css', express.static(path.join(__dirname, '../')));

const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));

const caminhoFrontendGerente = path.join(__dirname, '../frontend-Gerente');
console.log('Caminho frontend-Gerente:', caminhoFrontendGerente);
app.use('/frontend-Gerente', express.static(caminhoFrontendGerente));

app.use(cookieParser());

app.use((req, res, next) => {
  const allowedOrigins = ['http://127.0.0.1:5500','http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// Rotas
const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);
const cargoRoutes = require('./routes/cargoRoutes');
app.use('/cargo', cargoRoutes);
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/cliente', clienteRoutes);
const pessoaRoutes = require('./routes/pessoaRoutes');
app.use('/pessoa', pessoaRoutes);
const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionario', funcionarioRoutes);
const enderecoRoutes = require('./routes/enderecoRoutes');
app.use('/endereco', enderecoRoutes);
const produtoRoutes = require('./routes/produtoRoutes');
app.use('/produto', produtoRoutes);
const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/pedido', pedidoRoutes);
const PedidoHasProdutoRoutes = require('./routes/PedidoHasProdutoRoutes');
app.use('/PedidoHasProduto', PedidoHasProdutoRoutes);
const pagamentoRoutes = require('./routes/pagamentoRoutes');
app.use('/pagamento', pagamentoRoutes);
const FormaDePagamentoRoutes = require('./routes/FormaDePagamentoRoutes');
app.use('/FormaDePagamento', FormaDePagamentoRoutes);
const PagamentoHasFormaPagamentoRoutes = require('./routes/PagamentoHasFormaPagamentoRoutes');
app.use('/PagamentoHasFormaPagamento', PagamentoHasFormaPagamentoRoutes);
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz! -------',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL');
    const connectionTest = await db.testConnection();
    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }
    console.log('✅ PostgreSQL conectado com sucesso');
    const PORT = process.env.PORT || PORT_FIXA;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

startServer();
