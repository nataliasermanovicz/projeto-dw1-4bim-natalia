-- ======================
-- TABELAS BÁSICAS
-- ======================

CREATE TABLE Endereco (
    idEndereco SERIAL PRIMARY KEY,
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    referencia VARCHAR(45),
    cep VARCHAR(9),
    CidadeIdCidade INT
);  

CREATE TABLE Pessoa (
    cpfPessoa VARCHAR(20) PRIMARY KEY,
    nomePessoa VARCHAR(60),
    emailPessoa VARCHAR(60),
    senhaPessoa VARCHAR(32),
    dataNascimentoPessoa DATE,
    EnderecoIdEndereco INT REFERENCES Endereco(idEndereco)
);
 
CREATE TABLE Cargo (
    idCargo SERIAL PRIMARY KEY,
    nomeCargo VARCHAR(45)
);

CREATE TABLE Funcionario ( 
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES Pessoa(cpfPessoa),
    salario DOUBLE PRECISION,
    CargosIdCargo INT REFERENCES Cargo(idCargo)
);
 
CREATE TABLE Cliente (
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES Pessoa(cpfPessoa),
    rendaCliente DOUBLE PRECISION,
    dataDeCadastroCliente DATE
);

CREATE TABLE Produto (
    idProduto SERIAL PRIMARY KEY,
    nomeProduto VARCHAR(45),
    imagemProduto VARCHAR(225),
    quantidadeEmEstoque INT,
    precoUnitario DOUBLE PRECISION
);

CREATE TABLE Pedido (
    idPedido SERIAL PRIMARY KEY,
    dataDoPedido DATE,
    ClientePessoaCpfPessoa VARCHAR(20) REFERENCES Cliente(PessoaCpfPessoa),
    FuncionarioPessoaCpfPessoa VARCHAR(20) REFERENCES Funcionario(PessoaCpfPessoa)
);

CREATE TABLE PedidoHasProduto (
    ProdutoIdProduto INT REFERENCES Produto(idProduto),
    PedidoIdPedido INT REFERENCES Pedido(idPedido),
    quantidade INT,
    precoUnitario DOUBLE PRECISION,
    PRIMARY KEY (ProdutoIdProduto, PedidoIdPedido)
);

CREATE TABLE Pagamento (
    PedidoIdPedido INT PRIMARY KEY REFERENCES Pedido(idPedido),
    dataPagamento TIMESTAMP,
    valorTotalPagamento DOUBLE PRECISION
);

CREATE TABLE FormaDePagamento (
    idFormaPagamento SERIAL PRIMARY KEY,
    nomeFormaPagamento VARCHAR(100)
);

CREATE TABLE PagamentoHasFormaPagamento (
    PagamentoIdPedido INT REFERENCES Pagamento(PedidoIdPedido),
    FormaPagamentoIdFormaPagamento INT REFERENCES FormaDePagamento(idFormaPagamento),
    valorPago DOUBLE PRECISION,
    PRIMARY KEY (PagamentoIdPedido, FormaPagamentoIdFormaPagamento)
);

-- ======================
-- POPULAR COM 10 REGISTROS
-- ======================

-- Endereco
INSERT INTO Endereco (logradouro, numero, referencia, cep, CidadeIdCidade) VALUES
('Rua A', '10', 'Próx. praça', '11111-111', 1),
('Rua B', '20', 'Esquina', '22222-222', 1),
('Rua C', '30', 'Ao lado do mercado', '33333-333', 2),
('Rua D', '40', 'Próx. escola', '44444-444', 2),
('Rua E', '50', 'Próx. hospital', '55555-555', 3),
('Rua F', '60', 'Centro', '66666-666', 3),
('Rua G', '70', 'Bairro novo', '77777-777', 4),
('Rua H', '80', 'Fundos', '88888-888', 4),
('Rua I', '90', 'Lado direito', '99999-999', 5),
('Rua J', '100', 'Final da rua', '10101-101', 5);

-- Pessoa
-- (cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco)
INSERT INTO Pessoa (cpfPessoa, nomePessoa, emailPessoa, senhaPessoa, dataNascimentoPessoa, EnderecoIdEndereco) VALUES
('11111111111', 'Ana Silva', 'ana@email.com', '123456', '1990-01-01', 1),
('22222222222', 'João Souza', 'joao@email.com', '123456', '1985-02-02', 2),
('33333333333', 'Maria Oliveira', 'maria@email.com', '123456', '1992-03-03', 3),
('44444444444', 'Pedro Santos', 'pedro@email.com', '123456', '1988-04-04', 4),
('55555555555', 'Carla Ferreira', 'carla@email.com', '123456', '1995-05-05', 5),
('66666666666', 'Lucas Lima', 'lucas@email.com', '123456', '1991-06-06', 6),
('77777777777', 'Marcos Pereira', 'marcos@email.com', '123456', '1987-07-07', 7),
('88888888888', 'Fernanda Costa', 'fernanda@email.com', '123456', '1993-08-08', 8),
('99999999999', 'Juliana Rocha', 'juliana@email.com', '123456', '1994-09-09', 9),
('10101010101', 'Ricardo Alves', 'ricardo@email.com', '123456', '1996-10-10', 10);

-- Cargo
INSERT INTO Cargo (nomeCargo) VALUES
('Gerente'),
('Atendente'),
('Atendente'),
('Atendente'),
('Atendente'),
('Atendente'),
('Atendente'),
('Atendente'),
('Marketing'),
('Atendente');

-- Funcionario
-- (PessoaCpfPessoa, salario, CargosIdCargo)
INSERT INTO Funcionario (PessoaCpfPessoa, salario, CargosIdCargo) VALUES
('11111111111', 3000, 1),
('22222222222', 2000, 2),
('33333333333', 2000, 3),
('44444444444', 2000, 4),
('55555555555', 2000, 5),
('66666666666', 2000, 6),
('77777777777', 2000, 7),
('88888888888', 2000, 8),
('99999999999', 2000, 9),
('10101010101', 2000, 10);

-- Cliente
-- (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente)
INSERT INTO Cliente (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente) VALUES
('11111111111', 4000, '2020-01-01'),
('22222222222', 3000, '2020-02-01'),
('33333333333', 3500, '2020-03-01'),
('44444444444', 2500, '2020-04-01'),
('55555555555', 2000, '2020-05-01'),
('66666666666', 5000, '2020-06-01'),
('77777777777', 6000, '2020-07-01'),
('88888888888', 7000, '2020-08-01'),
('99999999999', 8000, '2020-09-01'),
('10101010101', 9000, '2020-10-01');

-- Produto
INSERT INTO Produto (nomeProduto, imagemProduto, quantidadeEmEstoque, precoUnitario) VALUES
('Risqué Felicidade', 'imgs/felicidade.jpg', 100, 12.90),
('Risqué Condessa', 'imgs/condessa.jpg', 200, 12.90),
('Risqué Preto Sépia', 'imgs/pretosepia.webp', 150, 12.90),
('Risqué A.Mar', 'imgs/amar.jpg', 300, 16.90),
('Risqué Granulado Rosé', 'imgs/granuladorose.jpg', 250, 15.90),
('Risqué Menta.liza', 'imgs/mentaliza.jpg', 120, 15.90),
('Colorama Azul Sereno', 'imgs/azulsereno.jpg', 80, 11.50),
('Colorama Rosa Chic', 'imgs/rosachic.jpg', 60, 11.50),
('Big Universo Glitter', 'imgs/glitter.jpg', 40, 18.00),
('Impala Nude Básico', 'imgs/nudebasico.jpg', 90, 13.00);

-- Pedido
-- (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa)
INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES
('2024-01-01', '11111111111', '22222222222'),
('2024-01-02', '33333333333', '44444444444'),
('2024-01-03', '55555555555', '66666666666'),
('2024-01-04', '77777777777', '88888888888'),
('2024-01-05', '99999999999', '10101010101'),
('2024-01-06', '22222222222', '33333333333'),
('2024-01-07', '44444444444', '55555555555'),
('2024-01-08', '66666666666', '77777777777'),
('2024-01-09', '88888888888', '99999999999'),
('2024-01-10', '10101010101', '11111111111');

-- PedidoHasProduto
INSERT INTO PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario) VALUES
(1, 1, 2, 12.9),
(2, 2, 1, 25.8),
(3, 3, 5, 25.8),
(4, 4, 3, 12.9),
(5, 5, 2, 38.7),
(6, 6, 4, 38.7),
(7, 7, 1, 12.9),
(8, 8, 2, 25.8),
(9, 9, 6, 77.4),
(10, 10, 2, 12.9);

-- Pagamento
INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES
(1, '2024-01-02 10:00:00', 12.9),
(2, '2024-01-03 11:00:00', 25.8),
(3, '2024-01-04 12:00:00', 25.8),
(4, '2024-01-05 13:00:00', 12.9),
(5, '2024-01-06 14:00:00', 38.7),
(6, '2024-01-07 15:00:00', 38.7),
(7, '2024-01-08 16:00:00', 12.9),
(8, '2024-01-09 17:00:00', 25.8),
(9, '2024-01-10 18:00:00', 77.4),
(10, '2024-01-11 19:00:00', 12.9);

-- FormaDePagamento
INSERT INTO FormaDePagamento (nomeFormaPagamento) VALUES
('Cartão'),
('PIX');

-- PagamentoHasFormaPagamento
INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago) VALUES
(1, 1, 12.9),
(2, 2, 25.8),
(3, 1, 25.8),
(4, 1, 12.9),
(5, 2, 38.7),
(6, 2, 38.7),
(7, 1, 12.9),
(8, 1, 25.8),
(9, 1, 77.4),
(10, 2, 12.9);
