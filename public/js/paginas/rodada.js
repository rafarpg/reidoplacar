const ligaId = new URLSearchParams(location.search).get('id');
const el = (id) => document.getElementById(id);
let rodadaId = null;
let statusAtual = null;
let souDono = false;

async function carregarRodada(idEspecifico) {
  const d = idEspecifico ? await api.get('/rodadas/' + idEspecifico) : await api.get('/ligas/' + ligaId + '/rodada-atual');
  if (!d.rodada) {
    el('titulo').textContent = 'Rodada';
    el('jogos').textContent = 'O campeonato ainda não foi gerado.';
    return;
  }
  rodadaId = d.rodada.id;
  statusAtual = d.rodada.status;
  desenhar(d);
}

function desenhar(d) {
  const aberta = d.rodada.status === 'aberta';
  el('titulo').textContent = 'Rodada ' + d.rodada.numero + ' de ' + d.rodada.total + ' · ' + textoRodada[d.rodada.status];
  const jogos = el('jogos');
  jogos.textContent = '';
  d.partidas.forEach((p) => {
    const meio = criar('div', null, 'meio');
    if (aberta) {
      const a = criar('input'); const b = criar('input');
      [a, b].forEach((i) => { i.type = 'number'; i.min = 0; i.dataset.partida = p.id; });
      a.dataset.lado = 'casa'; b.dataset.lado = 'fora';
      if (p.meuPalpite) { a.value = p.meuPalpite.golsCasa; b.value = p.meuPalpite.golsFora; }
      meio.append(a, criar('span', ' x '), b);
    } else {
      if (p.golsCasa !== null) meio.appendChild(criar('div', p.golsCasa + ' x ' + p.golsFora));
      meio.appendChild(criar('div', p.meuPalpite ? 'Palpite ' + p.meuPalpite.golsCasa + ' x ' + p.meuPalpite.golsFora : 'sem palpite'));
      if (p.meuPalpite && p.meuPalpite.pontos !== null) meio.appendChild(criar('div', p.meuPalpite.pontos + ' pts', 'pontos'));
    }
    jogos.appendChild(linhaJogo(p, meio));
  });

  const rodape = el('rodape');
  rodape.textContent = '';
  if (aberta) {
    const b = criar('button', 'Salvar palpites', 'botao');
    b.onclick = salvar;
    rodape.appendChild(b);
  } else if (d.rodada.status === 'finalizada' && d.rodada.numero < 7) {
    const b = criar('button', 'Ir para a próxima rodada', 'botao');
    b.onclick = () => { el('aviso').hidden = true; carregarRodada().catch(mostrarErro); };
    rodape.appendChild(b);
  }
}

const MAX_GOLS = 2147483647;

function mostrarErro(err) {
  el('erro').textContent = err.message === 'Failed to fetch' ? 'Sem conexão' : err.message;
}

async function salvar() {
  el('erro').textContent = '';
  erroDaConsulta = false;
  el('ok').textContent = '';
  const palpites = [];
  const campos = document.querySelectorAll('#jogos input');
  const porPartida = {};
  campos.forEach((i) => {
    porPartida[i.dataset.partida] = porPartida[i.dataset.partida] || {};
    porPartida[i.dataset.partida][i.dataset.lado] = i.value;
  });
  for (const id in porPartida) {
    const { casa, fora } = porPartida[id];
    if (casa === '' && fora === '') continue;
    if (casa === '' || fora === '') { el('erro').textContent = 'Preencha os dois lados de cada jogo (ou deixe os dois vazios)'; return; }
    const gc = Number(casa); const gf = Number(fora);
    if (![gc, gf].every((g) => Number.isInteger(g) && g >= 0)) { el('erro').textContent = 'Os gols devem ser números inteiros a partir de 0'; return; }
    if (gc > MAX_GOLS || gf > MAX_GOLS) { el('erro').textContent = 'Número de gols grande demais'; return; }
    palpites.push({ partidaId: Number(id), golsCasa: gc, golsFora: gf });
  }
  if (!palpites.length) { el('erro').textContent = 'Preencha pelo menos um jogo'; return; }
  try {
    await api.put('/rodadas/' + rodadaId + '/palpites', { palpites });
    el('ok').textContent = 'Palpites salvos';
  } catch (err) {
    const encerrado = err.message === 'Palpites encerrados';
    el('erro').textContent = encerrado ? 'Não é possível salvar seu palpite, pois a rodada já começou' : err.message;
    if (encerrado) travou();
  }
}

function travou() {
  document.querySelectorAll('#jogos input').forEach((i) => { i.disabled = true; });
  el('aviso').textContent = 'Não é possível salvar seu palpite, pois a rodada já começou';
  el('aviso').hidden = false;
  carregarRodada(rodadaId).catch(mostrarErro);
}

let erroDaConsulta = false;

async function verificarStatus() {
  if (document.visibilityState === 'hidden' || !rodadaId) return;
  try {
    const { status } = await api.get('/rodadas/' + rodadaId + '/status');
    if (erroDaConsulta) { el('erro').textContent = ''; erroDaConsulta = false; }
    if (status !== statusAtual) {
      const anterior = statusAtual;
      statusAtual = status;
      if (status !== 'aberta' && anterior === 'aberta') {
        document.querySelectorAll('#jogos input').forEach((i) => { i.disabled = true; });
        el('aviso').textContent = 'Não é possível salvar seu palpite, pois a rodada já começou';
        el('aviso').hidden = false;
      }
      await carregarRodada(rodadaId);
      if (status === 'finalizada') {
        el('aviso').textContent = 'Rodada finalizada. Veja os resultados abaixo.';
        el('aviso').hidden = false;
      }
    }
  } catch (err) { mostrarErro(err); erroDaConsulta = true; }
}

(async () => {
  try {
    const liga = await api.get('/ligas/' + ligaId);
    souDono = liga.souDono;
    abasLiga(ligaId, souDono, 'rodada');
    await carregarRodada();
  } catch (err) { mostrarErro(err); }
  setInterval(verificarStatus, 3000);
  document.addEventListener('visibilitychange', verificarStatus);
})();
