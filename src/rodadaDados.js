const { pool } = require('./db');

async function montarRodada(rodada, usuarioId) {
  const [partidas] = await pool.query(
    `SELECT pa.id, pa.gols_casa, pa.gols_fora,
            tc.id AS casa_id, tc.nome AS casa_nome, tc.sigla AS casa_sigla,
            tf.id AS fora_id, tf.nome AS fora_nome, tf.sigla AS fora_sigla,
            p.gols_casa AS p_casa, p.gols_fora AS p_fora, p.pontos AS p_pontos
     FROM partidas pa
     JOIN times tc ON tc.id = pa.time_casa_id
     JOIN times tf ON tf.id = pa.time_fora_id
     LEFT JOIN palpites p ON p.partida_id = pa.id AND p.usuario_id = ?
     WHERE pa.rodada_id = ? ORDER BY pa.id`, [usuarioId, rodada.id]);

  const [part] = await pool.query(
    'SELECT COUNT(*) AS n FROM liga_membros WHERE liga_id = ?', [rodada.liga_id]);
  const [jaP] = await pool.query(
    `SELECT COUNT(*) AS n FROM (
       SELECT p.usuario_id FROM palpites p
       JOIN partidas pa ON pa.id = p.partida_id
       JOIN liga_membros lm ON lm.usuario_id = p.usuario_id AND lm.liga_id = ?
       WHERE pa.rodada_id = ?
       GROUP BY p.usuario_id HAVING COUNT(*) = ?) t`,
    [rodada.liga_id, rodada.id, partidas.length]);

  const finalizada = rodada.status === 'finalizada';
  return {
    rodada: { id: rodada.id, numero: rodada.numero, status: rodada.status, total: 7 },
    participantes: Number(part[0].n),
    jaPalpitaram: Number(jaP[0].n),
    partidas: partidas.map((p) => ({
      id: p.id,
      casa: { id: p.casa_id, nome: p.casa_nome, sigla: p.casa_sigla },
      fora: { id: p.fora_id, nome: p.fora_nome, sigla: p.fora_sigla },
      golsCasa: finalizada ? p.gols_casa : null,
      golsFora: finalizada ? p.gols_fora : null,
      meuPalpite: p.p_casa === null ? null
        : { golsCasa: p.p_casa, golsFora: p.p_fora, pontos: p.p_pontos },
    })),
  };
}

module.exports = { montarRodada };
