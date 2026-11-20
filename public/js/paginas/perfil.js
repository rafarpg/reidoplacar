const campo = (id) => document.getElementById(id);

async function carregar() {
  try {
    const u = await api.get('/usuarios/me');
    campo('nome').value = u.nome;
    campo('email').value = u.email;
  } catch (err) {
    campo('erro').textContent = err.message;
  }
}

campo('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  campo('erro').textContent = '';
  campo('ok').textContent = '';
  const corpo = { nome: campo('nome').value.trim(), email: campo('email').value.trim() };
  if (campo('novaSenha').value) {
    corpo.senhaAtual = campo('senhaAtual').value;
    corpo.novaSenha = campo('novaSenha').value;
  }
  try {
    const r = await api.put('/usuarios/me', corpo);
    sessao.salvar(sessao.token(), r.usuario);
    campo('senhaAtual').value = '';
    campo('novaSenha').value = '';
    campo('ok').textContent = 'Perfil salvo';
  } catch (err) {
    campo('erro').textContent = err.message;
  }
});

campo('form-excluir').addEventListener('submit', async (e) => {
  e.preventDefault();
  campo('erro-excluir').textContent = '';
  if (!confirm('Tem certeza? Sua conta e suas ligas serão apagadas.')) return;
  try {
    await api.del('/usuarios/me', { senha: campo('senhaExcluir').value });
    sessao.sair();
    location.href = '/index.html';
  } catch (err) {
    campo('erro-excluir').textContent = err.message;
  }
});

carregar();
