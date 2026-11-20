const express = require('express');
const { pool, transacao } = require('../db');
const { autenticar } = require('../autenticar');
const { exigirMembro, exigirDono } = require('../permissoes');
const { erroHttp } = require('../erro');
const { calcularPontos } = require('../pontuacao');
const { montarRodada } = require('../rodadaDados');

const router = express.Router();
router.use(autenticar);

router.use('/:id', async (req, res, next) => {
  try {
    const [r] = await pool.query('SELECT * FROM rodadas WHERE id = ?', [req.params.id]);
    if (!r.length) return res.status(404).json({ erro: 'Rodada não encontrada' });
    req.rodada = r[0];
    req.ligaId = r[0].liga_id;
    next();
  } catch (e) { next(e); }
}, exigirMembro);

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await montarRodada(req.rodada, req.usuario.id));
  } catch (e) { next(e); }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    const [r] = await pool.query('SELECT id, numero, status FROM rodadas WHERE id = ?', [req.rodada.id]);
    res.json(r[0]);
  } catch (e) { next(e); }
});

const MAX_GOLS = 2147483647;
const golsValido = (g) => Number.isInteger(g) && g >= 0;

router.put('/:id/palpites', async (req, res, next) => {
  try {
    const lista = req.body.palpites;
    if (!Array.isArray(lista) || lista.length === 0)
      return res.status(400).json({ erro: 'Envie os palpites' });
    for (const p of lista) {
      if (!p || typeof p !== 'object' || !Number.isInteger(p.partidaId))
        return res.status(400).json({ erro: 'Envie os palpites' });
      if (!golsValido(p.golsCasa) || !golsValido(p.golsFora))
        return res.status(400).json({ erro: 'Os gols devem ser números inteiros a partir de 0' });
      if (p.golsCasa > MAX_GOLS || p.golsFora > MAX_GOLS)
        return res.status(400).json({ erro: 'Número de gols grande demais' });
    }

    const salvos = await transacao(async (conn) => {
      const [r] = await conn.query('SELECT status FROM rodadas WHERE id = ? FOR UPDATE', [req.rodada.id]);
      if (r[0].status !== 'aberta') throw erroHttp(409, 'Palpites encerrados');

      const [partidas] = await conn.query('SELECT id FROM partidas WHERE rodada_id = ?', [req.rodada.id]);
      const ids = partidas.map((p) => p.id);
      for (const p of lista) {
        if (!ids.includes(p.partidaId)) throw erroHttp(400, 'Jogo não pertence a esta rodada');
      }
      for (const p of lista) {
        await conn.query(
          `INSERT INTO palpites (usuario_id, partida_id, gols_casa, gols_fora) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE gols_casa = VALUES(gols_casa), gols_fora = VALUES(gols_fora)`,
          [req.usuario.id, p.partidaId, p.golsCasa, p.golsFora]);
      }
      return lista.length;
    });
    res.json({ salvos });
  } catch (e) { next(e); }
});

router.post('/:id/iniciar', exigirDono, async (req, res, next) => {
  try {
    await transacao(async (conn) => {
      const [r] = await conn.query('SELECT status FROM rodadas WHERE id = ? FOR UPDATE', [req.rodada.id]);
      if (r[0].status !== 'aberta') throw erroHttp(409, 'A rodada não está aberta');
      await conn.query("UPDATE rodadas SET status = 'em_andamento', iniciada_em = NOW() WHERE id = ?", [req.rodada.id]);
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/:id/resultados', exigirDono, async (req, res, next) => {
  try {
    const resposta = await transacao(async (conn) => {
      const [r] = await conn.query('SELECT status, liga_id, numero FROM rodadas WHERE id = ? FOR UPDATE', [req.rodada.id]);
      if (r[0].status !== 'em_andamento') throw erroHttp(409, 'A rodada não está em andamento');

      const [partidas] = await conn.query('SELECT id FROM partidas WHERE rodada_id = ?', [req.rodada.id]);
      const placar = {};
      for (const p of partidas) {
        const golsCasa = Math.floor(Math.random() * 5);
        const golsFora = Math.floor(Math.random() * 5);
        placar[p.id] = { golsCasa, golsFora };
        await conn.query('UPDATE partidas SET gols_casa = ?, gols_fora = ? WHERE id = ?', [golsCasa, golsFora, p.id]);
      }

      const [palpites] = await conn.query(
        `SELECT p.id, p.partida_id, p.gols_casa, p.gols_fora FROM palpites p
         JOIN partidas pa ON pa.id = p.partida_id WHERE pa.rodada_id = ?`, [req.rodada.id]);
      for (const p of palpites) {
        const real = placar[p.partida_id];
        const pontos = calcularPontos(p.gols_casa, p.gols_fora, real.golsCasa, real.golsFora);
        await conn.query('UPDATE palpites SET pontos = ? WHERE id = ?', [pontos, p.id]);
      }

      await conn.query("UPDATE rodadas SET status = 'finalizada', finalizada_em = NOW() WHERE id = ?", [req.rodada.id]);

      let proximaRodada = null;
      if (r[0].numero < 7) {
        await conn.query("UPDATE rodadas SET status = 'aberta' WHERE liga_id = ? AND numero = ?", [r[0].liga_id, r[0].numero + 1]);
        const [prox] = await conn.query('SELECT id, numero FROM rodadas WHERE liga_id = ? AND numero = ?', [r[0].liga_id, r[0].numero + 1]);
        proximaRodada = prox[0];
      } else {
        await conn.query("UPDATE ligas SET status = 'encerrada' WHERE id = ?", [r[0].liga_id]);
      }
      return {
        rodada: { id: req.rodada.id, numero: r[0].numero, status: 'finalizada' },
        proximaRodada,
        ligaEncerrada: r[0].numero === 7,
      };
    });
    res.json(resposta);
  } catch (e) { next(e); }
});

module.exports = router;
