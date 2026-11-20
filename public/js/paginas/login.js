if (sessao.token()) location.href = '/minhas-ligas.html';

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erro = document.getElementById('erro');
  erro.textContent = '';
  try {
    const r = await api.post('/auth/login', {
      email: document.getElementById('email').value.trim(),
      senha: document.getElementById('senha').value,
    });
    sessao.salvar(r.token, r.usuario);
    location.href = '/minhas-ligas.html';
  } catch (err) {
    erro.textContent = err.message;
  }
});
