// Cria um elemento com texto seguro (textContent, nunca innerHTML)
function criar(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto != null) e.textContent = texto;
  if (classe) e.className = classe;
  return e;
}

const textoStatus = { aguardando: 'Aguardando campeonato', em_andamento: 'Em andamento', encerrada: 'Encerrada' };

// Linha "Rodada X de 7 · situação · N participantes"
function resumoLiga(l) {
  const rodada = l.rodadaAtual ? 'Rodada ' + l.rodadaAtual + ' de 7 · ' : '';
  return rodada + textoStatus[l.status] + ' · ' + l.participantes + ' participante(s)';
}

// Círculo com a sigla do time (cor no CSS)
function escudo(time) {
  return criar('span', time.sigla, 'escudo ' + time.sigla);
}

// Abas da área da liga. ativa: 'painel' | 'rodada' | 'ranking' | 'meus-palpites' | 'gerenciar'
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

// Cartão de um jogo: escudos, nomes e o miolo (campos, placar...) que quem chama monta
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

// Texto ao passar o mouse nas colunas de pontos do ranking
const dicaPontos = {
  10: '10 pontos: acertou o placar exato',
  7: '7 pontos: acertou o vencedor (ou empate) e os gols de um time',
  5: '5 pontos: acertou só o vencedor (ou empate)',
  2: '2 pontos: acertou só os gols de um time',
  pontos: 'Soma dos pontos de todos os jogos (10, 7, 5, 2 ou 0 por jogo)',
};

// Tabela do ranking: #, participante, 10, 7, 5, 2, pontos
function tabelaRanking(linhas) {
  const t = criar('table', null, 'tabela');
  const comDica = (tag, texto, chave) => {
    const e = criar(tag, texto, 'dica');
    e.title = dicaPontos[chave];
    return e;
  };
  const cab = criar('tr');
  cab.append(criar('th', ''), criar('th', 'Participante', 'nome'),
    comDica('th', '10', 10), comDica('th', '7', 7), comDica('th', '5', 5), comDica('th', '2', 2), comDica('th', 'Pontos', 'pontos'));
  t.appendChild(cab);
  linhas.forEach((l) => {
    const tr = criar('tr', null, l.souEu ? 'eu' : '');
    tr.append(criar('td', l.posicao), criar('td', l.nome + (l.souEu ? ' (você)' : ''), 'nome'),
      comDica('td', l.exatos, 10), comDica('td', l.setes, 7), comDica('td', l.cincos, 5), comDica('td', l.dois, 2), comDica('td', l.pontos, 'pontos'));
    t.appendChild(tr);
  });
  return t;
}
