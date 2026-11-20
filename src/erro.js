function erroHttp(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

module.exports = { erroHttp };
