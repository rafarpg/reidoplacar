// Guarda o token e o usuário no localStorage
const sessao = {
  salvar(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  token() { return localStorage.getItem('token'); },
  usuario() {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch (e) { return null; }
  },
  sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
  // Páginas da área logada chamam isto no começo
  exigirLogin() {
    if (!sessao.token()) location.href = '/index.html';
  },
};
