document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erro = document.getElementById('erro');
  erro.textContent = '';
  const senha = document.getElementById('senha').value;
  if (senha !== document.getElementById('confirmar').value) {
    erro.textContent = 'As senhas não conferem';
    return;
  }
  try {
    const r = await api.post('/auth/cadastro', {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      senha,
    });
    sessao.salvar(r.token, r.usuario);
    location.href = '/minhas-ligas.html';
  } catch (err) {
    erro.textContent = err.message;
  }
});
