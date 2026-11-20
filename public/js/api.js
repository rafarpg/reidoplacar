const api = {
  async chamar(metodo, caminho, corpo) {
    const opcoes = { method: metodo, headers: {} };
    if (sessao.token()) opcoes.headers.Authorization = 'Bearer ' + sessao.token();
    if (corpo !== undefined) {
      opcoes.headers['Content-Type'] = 'application/json';
      opcoes.body = JSON.stringify(corpo);
    }
    const resp = await fetch('/api' + caminho, opcoes);
    const dados = resp.status === 204 ? null : await resp.json().catch(() => ({}));
    if (resp.status === 401 && !caminho.startsWith('/auth/')) {
      sessao.sair();
      location.href = '/index.html';
    }
    if (!resp.ok) throw new Error((dados && dados.erro) || 'Erro inesperado');
    return dados;
  },
  get(c) { return api.chamar('GET', c); },
  post(c, b) { return api.chamar('POST', c, b || {}); },
  put(c, b) { return api.chamar('PUT', c, b); },
  del(c, b) { return api.chamar('DELETE', c, b || {}); },
};
