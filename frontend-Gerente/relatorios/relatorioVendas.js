const API_BASE_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    // Define data de hoje no rodapé
    document.getElementById('dataHoje').textContent = new Date().toLocaleString('pt-BR');
    
    // Define datas padrão (início do mês até hoje) nos inputs
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    document.getElementById('dataFim').value = hoje.toISOString().split('T')[0];
    document.getElementById('dataInicio').value = inicioMes.toISOString().split('T')[0];
});

document.getElementById('filtroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // CORREÇÃO: Chamando a função com o nome correto
    await gerarRelatorioVendas();
});

async function gerarRelatorioVendas() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const tbody = document.getElementById('tabelaCorpo');
    const msgSemDados = document.getElementById('mensagemSemDados');

    // Atualiza texto do período visualmente (ajustado para timezone local)
    const partesIni = dataInicio.split('-');
    const partesFim = dataFim.split('-');
    const dataIniFormat = `${partesIni[2]}/${partesIni[1]}/${partesIni[0]}`;
    const dataFimFormat = `${partesFim[2]}/${partesFim[1]}/${partesFim[0]}`;
    
    document.getElementById('periodoTexto').textContent = `Período: ${dataIniFormat} até ${dataFimFormat}`;

    try {
        const response = await fetch(`${API_BASE_URL}/relatorioVendas/vendas/gerar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataInicio, dataFim })
        });

        if (!response.ok) throw new Error('Erro ao buscar dados do servidor');

        const vendas = await response.json();

        // Limpa tabela
        tbody.innerHTML = '';

        if (vendas.length === 0) {
            msgSemDados.style.display = 'block';
            atualizarDashboard(0, 0);
            return;
        }

        msgSemDados.style.display = 'none';
        let faturamentoTotal = 0;

        // Renderiza linhas
        vendas.forEach(venda => {
            const tr = document.createElement('tr');
            
            // Tratamento de dados
            // Corrige fuso horário pegando apenas a parte da data
            let dataFormatada = '--/--/----';
            if(venda.data_pedido) {
                const dataObj = new Date(venda.data_pedido);
                dataFormatada = dataObj.toLocaleDateString('pt-BR');
            }

            const valor = parseFloat(venda.valor_total);
            const formaPg = venda.forma_pagamento || 'Pendente'; 

            faturamentoTotal += valor;

            tr.innerHTML = `
                <td>${venda.id_pedido}</td>
                <td>${dataFormatada}</td>
                <td>${venda.nome_cliente}</td>
                <td>${formaPg}</td>
                <td class="text-right">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            `;
            tbody.appendChild(tr);
        });

        atualizarDashboard(vendas.length, faturamentoTotal);

    } catch (error) {
        console.error(error);
        alert('Erro ao gerar relatório. Verifique se o servidor está rodando.');
    }
}

function atualizarDashboard(qtd, total) {
    document.getElementById('qtdVendas').textContent = qtd;
    document.getElementById('totalFaturamento').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const ticket = qtd > 0 ? (total / qtd) : 0;
    document.getElementById('ticketMedio').textContent = ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}