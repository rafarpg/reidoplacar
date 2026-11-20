const ligaId = new URLSearchParams(location.search).get('id');
const campo = (id) => document.getElementById(id);

async function carregar() {
  try {
    const l = await api.get('/ligas/' + ligaId);
    if (!l.souDono) { location.href = '/minhas-ligas.html'; return; }
    abasLiga(ligaId, true, 'gerenciar');
    campo('titulo').textContent = 'Gerenciar: ' + l.nome;
    campo('nome').value = l.nome;
    campo('descricao').value = l.descricao || '';
    await carregarCampeonato(l);
  } catch (err) {
    campo('erro').textContent = err.message;
  }
}

async function carregarCampeonato(liga) {
  const gerar = campo('gerar');
  const tabela = campo('tabela-rodadas');
  if (liga.status === 'aguardando') {
    campo('texto-camp').textContent = 'Gere o campeonato (7 rodadas, 28 jogos) quando todos tiverem entrado. Quem entrar depois ainda poderá participar.';
    gerar.disabled = false;
    gerar.textContent = 'Gerar campeonato';
    tabela.hidden = true;
    return;
  }
  campo('texto-camp').textContent = '';
  gerar.disabled = true;
  gerar.textContent = 'Campeonato gerado';
  const rodadas = await api.get('/ligas/' + ligaId + '/rodadas');
  const corpo = tabela.querySelector('tbody');
  corpo.textContent = '';
  rodadas.forEach((r) => {
    const tr = criar('tr');
    const acao = criar('td');
    if (r.status === 'aberta') acao.appendChild(botao('Iniciar rodada', '/rodadas/' + r.id + '/iniciar', 'Iniciar a rodada? Os palpites serão encerrados.'));
    if (r.status === 'em_andamento') acao.appendChild(botao('Ver resultados', '/rodadas/' + r.id + '/resultados'));
    tr.append(criar('td', r.numero), criar('td', textoRodada[r.status] || r.status), acao);
    corpo.appendChild(tr);
  });
  tabela.hidden = false;
}

function botao(texto, caminho, confirmacao) {
  const b = criar('button', texto, 'pequeno');
  b.onclick = async () => {
    if (confirmacao && !confirm(confirmacao)) return;
    b.disabled = true;
    try { await api.post(caminho); } catch (err) { campo('erro-camp').textContent = err.message; }
    carregar();
  };
  return b;
}

campo('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  campo('erro').textContent = '';
  campo('ok').textContent = '';
  try {
    await api.put('/ligas/' + ligaId, { nome: campo('nome').value.trim(), descricao: campo('descricao').value.trim() });
    campo('ok').textContent = 'Liga salva';
    carregar();
  } catch (err) {
    campo('erro').textContent = err.message;
  }
});

campo('gerar').addEventListener('click', async () => {
  campo('erro-camp').textContent = '';
  try {
    await api.post('/ligas/' + ligaId + '/campeonato');
    carregar();
  } catch (err) {
    campo('erro-camp').textContent = err.message;
  }
});

campo('excluir').addEventListener('click', async () => {
  if (!confirm('Excluir a liga com tudo dentro (participantes, campeonato e palpites)?')) return;
  try {
    await api.del('/ligas/' + ligaId);
    location.href = '/minhas-ligas.html';
  } catch (err) {
    campo('erro-excluir').textContent = err.message;
  }
});

carregar();
