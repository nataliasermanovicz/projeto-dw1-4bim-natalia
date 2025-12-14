const API_BASE_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dataHoje').textContent = new Date().toLocaleString('pt-BR');
    
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    document.getElementById('dataFim').value = hoje.toISOString().split('T')[0];
    document.getElementById('dataInicio').value = inicioMes.toISOString().split('T')[0];
});

document.getElementById('filtroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await gerarRelatorioClientes();
});

async function gerarRelatorioClientes() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const tbody = document.getElementById('tabelaCorpo');
    const msgSemDados = document.getElementById('mensagemSemDados');

    const partesIni = dataInicio.split('-');
    const partesFim = dataFim.split('-');
    const dataIniFormat = `${partesIni[2]}/${partesIni[1]}/${partesIni[0]}`;
    const dataFimFormat = `${partesFim[2]}/${partesFim[1]}/${partesFim[0]}`;
    
    document.getElementById('periodoTexto').textContent = `Cadastro realizado entre: ${dataIniFormat} até ${dataFimFormat}`;

    try {
        const response = await fetch(`${API_BASE_URL}/relatorioClientes/clientes/gerar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataInicio, dataFim })
        });

        if (!response.ok) throw new Error('Erro ao buscar dados do servidor');

        const clientes = await response.json();

        tbody.innerHTML = '';

        if (clientes.length === 0) {
            msgSemDados.style.display = 'block';
            atualizarDashboard(0, 0);
            return;
        }

        msgSemDados.style.display = 'none';
        let somaRendaTotal = 0;

        clientes.forEach(cli => {
            const tr = document.createElement('tr');
            
            // Tratamento de data (evita fuso horário)
            let dataCadastro = '--/--/----';
            if (cli.datadecadastrocliente) {
                const dataObj = new Date(cli.datadecadastrocliente);
                dataCadastro = dataObj.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            }

            const renda = parseFloat(cli.rendacliente || 0);
            somaRendaTotal += renda;

            tr.innerHTML = `
                <td>${cli.cpfpessoa}</td>
                <td>${cli.nomepessoa}</td>
                <td>${cli.emailpessoa}</td>
                <td>${dataCadastro}</td>
                <td class="text-right">${renda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            `;
            tbody.appendChild(tr);
        });

        atualizarDashboard(clientes.length, somaRendaTotal);

    } catch (error) {
        console.error(error);
        alert('Erro ao gerar relatório. Verifique se o servidor está rodando.');
    }
}

function atualizarDashboard(qtd, totalRenda) {
    document.getElementById('qtdClientes').textContent = qtd;
    document.getElementById('somaRendas').textContent = totalRenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const media = qtd > 0 ? (totalRenda / qtd) : 0;
    document.getElementById('rendaMedia').textContent = media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}