async function carregar() {
  try {
    const ligas = await api.get('/ligas/minhas');
    const lista = document.getElementById('lista');
    lista.textContent = '';
    document.getElementById('vazio').textContent = ligas.length ? '' : 'Você ainda não participa de nenhuma liga. Crie uma ou entre numa liga pública.';
    ligas.forEach((l) => lista.appendChild(cartao(l)));
  } catch (err) {
    document.getElementById('erro').textContent = err.message;
  }
}

function cartao(l) {
  const div = criar('div', null, 'cartao liga');
  const texto = criar('div');
  const titulo = criar('h2', l.nome);
  titulo.appendChild(criar('span', l.souDono ? 'Dono' : 'Participante', 'etiqueta'));
  texto.append(titulo, criar('p', 'Dono: ' + l.dono.nome, 'info'), criar('p', resumoLiga(l), 'info'));
  if (l.descricao) texto.appendChild(criar('p', l.descricao, 'info'));

  const acoes = criar('div', null, 'acoes');
  const abrir = criar('a', 'Abrir');
  abrir.href = '/liga/painel.html?id=' + l.id;
  acoes.appendChild(abrir);
  if (l.souDono) {
    const a = criar('a', 'Gerenciar');
    a.href = '/liga/gerenciar.html?id=' + l.id;
    acoes.appendChild(a);
  } else {
    const b = criar('button', 'Sair da liga', 'pequeno perigo');
    b.onclick = async () => {
      if (!confirm('Sair da liga "' + l.nome + '"? Seus palpites nela serão apagados.')) return;
      try { await api.del('/ligas/' + l.id + '/participar'); carregar(); }
      catch (err) { document.getElementById('erro').textContent = err.message; }
    };
    acoes.appendChild(b);
  }
  div.append(texto, acoes);
  return div;
}

carregar();
