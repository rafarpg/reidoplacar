document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erro = document.getElementById('erro');
  erro.textContent = '';
  try {
    const r = await api.post('/ligas', {
      nome: document.getElementById('nome').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
    });
    location.href = '/liga/gerenciar.html?id=' + r.liga.id;
  } catch (err) {
    erro.textContent = err.message;
  }
});
