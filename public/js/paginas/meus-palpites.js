const ligaId = new URLSearchParams(location.search).get('id');

async function carregar() {
  try {
    const liga = await api.get('/ligas/' + ligaId);
    abasLiga(ligaId, liga.souDono, 'meus-palpites');
    const rodadas = await api.get('/ligas/' + ligaId + '/meus-palpites');
    const lista = document.getElementById('lista');
    if (!rodadas.length) lista.appendChild(criar('p', 'Ainda não há rodadas.'));
    rodadas.forEach((r) => {
      const cartao = criar('div', null, 'cartao');
      cartao.appendChild(criar('h2', 'Rodada ' + r.numero + ' · ' + textoRodada[r.status]
        + (r.status === 'finalizada' ? ' · ' + r.pontos + ' pts' : '')));
      r.jogos.forEach((j) => {
        const meio = criar('div', null, 'meio');
        meio.appendChild(criar('div', j.meuPalpite ? 'Palpite ' + j.meuPalpite.golsCasa + ' x ' + j.meuPalpite.golsFora : 'sem palpite'));
        if (j.golsCasa !== null) meio.appendChild(criar('div', 'Resultado ' + j.golsCasa + ' x ' + j.golsFora));
        if (j.meuPalpite && j.meuPalpite.pontos !== null) meio.appendChild(criar('div', j.meuPalpite.pontos + ' pts', 'pontos'));
        cartao.appendChild(linhaJogo(j, meio));
      });
      lista.appendChild(cartao);
    });
  } catch (err) {
    document.getElementById('erro').textContent = err.message;
  }
}

carregar();
