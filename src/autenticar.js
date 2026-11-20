const jwt = require('jsonwebtoken');

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar' });
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: dados.id, nome: dados.nome };
    next();
  } catch (e) {
    res.status(401).json({ erro: 'Sessão inválida. Faça login novamente' });
  }
}

module.exports = { gerarToken, autenticar };
