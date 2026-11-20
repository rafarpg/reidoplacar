function criar(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto != null) e.textContent = texto;
  if (classe) e.className = classe;
  return e;
}

const textoStatus = { aguardando: 'Aguardando campeonato', em_andamento: 'Em andamento', encerrada: 'Encerrada' };

function resumoLiga(l) {
  const rodada = l.rodadaAtual ? 'Rodada ' + l.rodadaAtual + ' de 7 · ' : '';
  return rodada + textoStatus[l.status] + ' · ' + l.participantes + ' participante(s)';
}

function escudo(time) {
  return criar('span', time.sigla, 'escudo ' + time.sigla);
}

function abasLiga(ligaId, souDono, ativa) {
  const nav = criar('nav', null, 'abas');
  const itens = [['painel', 'Painel'], ['rodada', 'Rodada'], ['ranking', 'Ranking'], ['meus-palpites', 'Meus palpites']];
  if (souDono) itens.push(['gerenciar', 'Gerenciar']);
  itens.forEach(([pagina, texto]) => {
    const a = criar('a', texto, pagina === ativa ? 'ativa' : '');
    a.href = '/liga/' + pagina + '.html?id=' + ligaId;
    nav.appendChild(a);
  });
  const antigo = document.querySelector('nav.abas');
  if (antigo) antigo.remove();
  document.querySelector('main').prepend(nav);
}

function linhaJogo(partida, meio) {
  const div = criar('div', null, 'jogo');
  const lado = (time) => {
    const t = criar('div', null, 'time');
    t.append(escudo(time), criar('span', time.nome));
    return t;
  };
  div.append(lado(partida.casa), meio, lado(partida.fora));
  return div;
}

const textoRodada = { futura: 'Aguardando', aberta: 'Palpites abertos', em_andamento: 'Em andamento (palpites encerrados)', finalizada: 'Finalizada' };

const dicaPontos = {
  10: 'Acertou o placar exato',
  7: 'Acertou o vencedor (ou empate) e os gols de um time',
  5: 'Acertou só o vencedor (ou empate)',
  2: 'Acertou só os gols de um time',
};

function tabelaRanking(linhas) {
  const t = criar('table', null, 'tabela');
  const comDica = (tag, texto, chave) => {
    const e = criar(tag, texto, 'dica');
    e.title = dicaPontos[chave];
    return e;
  };
  const cab = criar('tr');
  cab.append(criar('th', ''), criar('th', 'Participante', 'nome'),
    comDica('th', '10', 10), comDica('th', '7', 7), comDica('th', '5', 5), comDica('th', '2', 2), criar('th', 'Pontos'));
  t.appendChild(cab);
  linhas.forEach((l) => {
    const tr = criar('tr', null, l.souEu ? 'eu' : '');
    tr.append(criar('td', l.posicao), criar('td', l.nome + (l.souEu ? ' (você)' : ''), 'nome'),
      comDica('td', l.exatos, 10), comDica('td', l.setes, 7), comDica('td', l.cincos, 5), comDica('td', l.dois, 2), criar('td', l.pontos));
    t.appendChild(tr);
  });
  return t;
}
