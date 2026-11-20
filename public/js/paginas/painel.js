const ligaId = new URLSearchParams(location.search).get('id');
const el = (id) => document.getElementById(id);
let ultimo = '';
let souDono = false;

async function atualizar(forcar) {
  if (document.visibilityState === 'hidden') return;
  try {
    const d = await api.get('/ligas/' + ligaId + '/rodada-atual');
    const chave = d.rodada ? [d.rodada.id, d.rodada.status, d.jaPalpitaram, d.participantes].join() : 'nenhuma';
    if (!forcar && chave === ultimo) { el('erro').textContent = ''; return; }
    ultimo = chave;
    const liga = await api.get('/ligas/' + ligaId);
    souDono = liga.souDono;
    el('titulo').textContent = liga.nome;
    abasLiga(ligaId, souDono, 'painel');
    desenharFaixa(d, liga);
    desenharMeus(d);
    desenharGestao(d, liga);
    await desenharRanking(liga);
    el('erro').textContent = '';
  } catch (err) {
    el('erro').textContent = err.message === 'Failed to fetch' ? 'Sem conexão' : err.message;
  }
}

function desenharFaixa(d, liga) {
  if (!d.rodada) {
    el('faixa').textContent = 'O campeonato ainda não foi gerado. ' + liga.participantes + ' participante(s).';
    return;
  }
  el('faixa').textContent = 'Rodada ' + d.rodada.numero + ' de ' + d.rodada.total + ' · ' + textoRodada[d.rodada.status]
    + ' · ' + d.jaPalpitaram + ' de ' + d.participantes + ' já palpitaram';
}

function desenharMeus(d) {
  const box = el('meus');
  box.textContent = '';
  box.appendChild(criar('h2', 'Meus palpites da rodada'));
  if (!d.rodada) { box.appendChild(criar('p', 'Sem rodada no momento.')); return; }
  d.partidas.forEach((p) => {
    const meio = criar('div', null, 'meio');
    meio.appendChild(criar('div', p.meuPalpite ? p.meuPalpite.golsCasa + ' x ' + p.meuPalpite.golsFora : 'sem palpite'));
    if (p.golsCasa !== null) meio.appendChild(criar('div', 'Resultado ' + p.golsCasa + ' x ' + p.golsFora));
    if (p.meuPalpite && p.meuPalpite.pontos !== null) meio.appendChild(criar('div', p.meuPalpite.pontos + ' pts', 'pontos'));
    box.appendChild(linhaJogo(p, meio));
  });
  if (d.rodada.status === 'aberta') {
    const a = criar('a', 'Palpitar / alterar palpites');
    a.href = '/liga/rodada.html?id=' + ligaId;
    box.appendChild(a);
  }
}

function desenharGestao(d, liga) {
  const box = el('gestao');
  box.textContent = '';
  if (!souDono) return;
  const cartao = criar('div', null, 'cartao');
  cartao.appendChild(criar('h2', 'Gestão da rodada'));
  if (!d.rodada) {
    const a = criar('a', 'Gerar o campeonato');
    a.href = '/liga/gerenciar.html?id=' + ligaId;
    cartao.appendChild(a);
  } else if (d.rodada.status === 'aberta') {
    cartao.appendChild(botaoAcao('Iniciar rodada', '/rodadas/' + d.rodada.id + '/iniciar', 'Iniciar a rodada? Os palpites serão encerrados.'));
  } else if (d.rodada.status === 'em_andamento') {
    cartao.appendChild(botaoAcao('Ver resultados', '/rodadas/' + d.rodada.id + '/resultados'));
  } else {
    cartao.appendChild(criar('p', 'Liga encerrada.'));
  }
  box.appendChild(cartao);
}

function botaoAcao(texto, caminho, confirmacao) {
  const b = criar('button', texto, 'botao');
  b.onclick = async () => {
    if (confirmacao && !confirm(confirmacao)) return;
    b.disabled = true;
    try { await api.post(caminho); } catch (err) { el('erro').textContent = err.message; }
    atualizar(true);
  };
  return b;
}

async function desenharRanking(liga) {
  const ranking = await api.get('/ligas/' + ligaId + '/ranking');
  el('campeao').textContent = '';
  if (liga.status === 'encerrada' && ranking.length) {
    el('campeao').appendChild(criar('div', 'Campeão: ' + ranking[0].nome + ' com ' + ranking[0].pontos + ' pontos', 'campeao'));
  }
  const box = el('ranking');
  box.textContent = '';
  box.appendChild(tabelaRanking(ranking.slice(0, 5)));
  const a = criar('a', 'Ver ranking completo');
  a.href = '/liga/ranking.html?id=' + ligaId;
  box.appendChild(a);
}

atualizar(true);
setInterval(() => atualizar(false), 3000);
document.addEventListener('visibilitychange', () => atualizar(false));
