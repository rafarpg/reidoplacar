const ligaId = new URLSearchParams(location.search).get('id');

async function carregar() {
  try {
    const liga = await api.get('/ligas/' + ligaId);
    abasLiga(ligaId, liga.souDono, 'ranking');
    const ranking = await api.get('/ligas/' + ligaId + '/ranking');
    if (liga.status === 'encerrada' && ranking.length) {
      document.getElementById('campeao').appendChild(
        criar('div', 'Campeão: ' + ranking[0].nome + ' com ' + ranking[0].pontos + ' pontos', 'campeao'));
    }
    document.getElementById('ranking').appendChild(tabelaRanking(ranking));
  } catch (err) {
    document.getElementById('erro').textContent = err.message;
  }
}

carregar();
