function calcularPontos(palpCasa, palpFora, resCasa, resFora) {
  if (palpCasa === resCasa && palpFora === resFora) return 10;
  const mesmoResultado = Math.sign(palpCasa - palpFora) === Math.sign(resCasa - resFora);
  const golsDeUmTime = palpCasa === resCasa || palpFora === resFora;
  if (mesmoResultado && golsDeUmTime) return 7;
  if (mesmoResultado) return 5;
  if (golsDeUmTime) return 2;
  return 0;
}

module.exports = { calcularPontos };
