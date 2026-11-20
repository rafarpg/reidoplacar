async function carregar() {
  try {
    const ligas = await api.get('/ligas');
    const lista = document.getElementById('lista');
    lista.textContent = '';
    document.getElementById('vazio').textContent = ligas.length ? '' : 'Nenhuma liga criada ainda.';
    ligas.forEach((l) => lista.appendChild(cartao(l)));
  } catch (err) {
    document.getElementById('erro').textContent = err.message;
  }
}

function cartao(l) {
  const div = criar('div', null, 'cartao liga');
  const texto = criar('div');
  texto.append(criar('h2', l.nome), criar('p', 'Dono: ' + l.dono.nome, 'info'), criar('p', resumoLiga(l), 'info'));
  if (l.descricao) texto.appendChild(criar('p', l.descricao, 'info'));

  let acao;
  if (l.souMembro) {
    acao = criar('span', 'Você participa', 'etiqueta');
  } else {
    acao = criar('button', 'Participar', 'pequeno');
    if (l.status === 'encerrada') {
      acao.disabled = true;
    } else {
      acao.onclick = async () => {
        try { await api.post('/ligas/' + l.id + '/participar'); carregar(); }
        catch (err) { document.getElementById('erro').textContent = err.message; }
      };
    }
  }
  div.append(texto, acao);
  return div;
}

carregar();
