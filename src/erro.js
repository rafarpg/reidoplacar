// Erro com código HTTP. O tratador final em app.js responde { erro: mensagem }.
function erroHttp(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

module.exports = { erroHttp };
