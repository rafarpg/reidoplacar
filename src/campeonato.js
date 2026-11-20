// Método do círculo: 8 times, 7 rodadas de 4 jogos, todos contra todos uma vez.
function gerarTabela(timeIds) {
  const t = [...timeIds].sort(() => Math.random() - 0.5);
  const rodadas = [];
  for (let r = 0; r < 7; r++) {
    const jogos = [];
    for (let i = 0; i < 4; i++) {
      let casa = t[i];
      let fora = t[7 - i];
      const inverte = i === 0 ? r % 2 === 1 : i % 2 === 1;
      if (inverte) [casa, fora] = [fora, casa];
      jogos.push({ casa, fora });
    }
    rodadas.push(jogos);
    t.splice(1, 0, t.pop()); // gira todos menos o primeiro
  }
  return rodadas;
}

module.exports = { gerarTabela };
