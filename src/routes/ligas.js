const express = require('express');
const { pool, transacao } = require('../db');
const { autenticar } = require('../autenticar');
const { exigirMembro, exigirDono } = require('../permissoes');
const { erroHttp } = require('../erro');
const { gerarTabela } = require('../campeonato');
const { montarRodada } = require('../rodadaDados');

const router = express.Router();
router.use(autenticar);

function validarLiga(nome, descricao) {
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100)
    return 'O nome da liga deve ter de 2 a 100 caracteres';
  if (descricao != null && (typeof descricao !== 'string' || descricao.length > 255))
    return 'A descrição pode ter no máximo 255 caracteres';
  return null;
}

async function listarLigas(usuarioId, onde) {
  const [linhas] = await pool.query(
    `SELECT l.id, l.nome, l.descricao, l.status, l.dono_id, u.nome AS dono_nome,
            (SELECT COUNT(*) FROM liga_membros WHERE liga_id = l.id) AS participantes,
            (SELECT numero FROM rodadas WHERE liga_id = l.id
              AND status IN ('aberta','em_andamento') LIMIT 1) AS rodada_atual,
            EXISTS(SELECT 1 FROM liga_membros WHERE liga_id = l.id AND usuario_id = ?) AS sou_membro
     FROM ligas l JOIN usuarios u ON u.id = l.dono_id
     ${onde ? 'WHERE ' + onde : ''}
     ORDER BY l.id DESC`,
    onde ? [usuarioId, usuarioId] : [usuarioId]);
  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    descricao: l.descricao,
    dono: { id: l.dono_id, nome: l.dono_nome },
    participantes: Number(l.participantes),
    status: l.status,
    rodadaAtual: l.status === 'encerrada' ? 7 : l.rodada_atual,
    souMembro: Boolean(l.sou_membro),
    souDono: l.dono_id === usuarioId,
  }));
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await listarLigas(req.usuario.id));
  } catch (e) { next(e); }
});

router.get('/minhas', async (req, res, next) => {
  try {
    res.json(await listarLigas(req.usuario.id,
      'EXISTS(SELECT 1 FROM liga_membros WHERE liga_id = l.id AND usuario_id = ?)'));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;
    const msg = validarLiga(nome, descricao);
    if (msg) return res.status(400).json({ erro: msg });

    const id = await transacao(async (conn) => {
      const [r] = await conn.query(
        'INSERT INTO ligas (nome, descricao, dono_id) VALUES (?, ?, ?)',
        [nome.trim(), descricao ? descricao.trim() : null, req.usuario.id]);
      await conn.query('INSERT INTO liga_membros (liga_id, usuario_id) VALUES (?, ?)', [r.insertId, req.usuario.id]);
      return r.insertId;
    });
    res.status(201).json({ liga: { id, nome: nome.trim(), descricao: descricao ? descricao.trim() : null } });
  } catch (e) { next(e); }
});

router.get('/:id', exigirMembro, async (req, res, next) => {
  try {
    const l = req.liga;
    const [dono] = await pool.query('SELECT id, nome FROM usuarios WHERE id = ?', [l.dono_id]);
    const [cont] = await pool.query('SELECT COUNT(*) AS n FROM liga_membros WHERE liga_id = ?', [l.id]);
    const [rod] = await pool.query(
      `SELECT numero, status FROM rodadas WHERE liga_id = ?
       AND (status IN ('aberta','em_andamento') OR (? = 'encerrada' AND numero = 7)) LIMIT 1`,
      [l.id, l.status]);
    res.json({
      id: l.id, nome: l.nome, descricao: l.descricao, dono: dono[0], status: l.status,
      participantes: Number(cont[0].n),
      souDono: l.dono_id === req.usuario.id,
      rodadaAtual: rod[0] || null,
    });
  } catch (e) { next(e); }
});

router.put('/:id', exigirMembro, exigirDono, async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;
    const msg = validarLiga(nome, descricao);
    if (msg) return res.status(400).json({ erro: msg });
    await pool.query('UPDATE ligas SET nome = ?, descricao = ? WHERE id = ?',
      [nome.trim(), descricao ? descricao.trim() : null, req.liga.id]);
    res.json({ liga: { id: req.liga.id, nome: nome.trim(), descricao: descricao ? descricao.trim() : null } });
  } catch (e) { next(e); }
});

router.delete('/:id', exigirMembro, exigirDono, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM ligas WHERE id = ?', [req.liga.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post('/:id/participar', async (req, res, next) => {
  try {
    const [ligas] = await pool.query('SELECT id, status FROM ligas WHERE id = ?', [req.params.id]);
    if (!ligas.length) return res.status(404).json({ erro: 'Liga não encontrada' });
    if (ligas[0].status === 'encerrada') return res.status(409).json({ erro: 'Esta liga já foi encerrada' });
    await pool.query('INSERT INTO liga_membros (liga_id, usuario_id) VALUES (?, ?)', [ligas[0].id, req.usuario.id]);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Você já participa desta liga' });
    next(e);
  }
});

router.delete('/:id/participar', exigirMembro, async (req, res, next) => {
  try {
    if (req.liga.dono_id === req.usuario.id)
      return res.status(409).json({ erro: 'O dono não pode sair. Exclua a liga se quiser encerrá-la' });
    await transacao(async (conn) => {
      await conn.query(
        `DELETE p FROM palpites p
         JOIN partidas pa ON pa.id = p.partida_id
         JOIN rodadas r ON r.id = pa.rodada_id
         WHERE r.liga_id = ? AND p.usuario_id = ?`, [req.liga.id, req.usuario.id]);
      await conn.query('DELETE FROM liga_membros WHERE liga_id = ? AND usuario_id = ?', [req.liga.id, req.usuario.id]);
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post('/:id/campeonato', exigirMembro, exigirDono, async (req, res, next) => {
  try {
    const rodadas = await transacao(async (conn) => {
      const [l] = await conn.query('SELECT status FROM ligas WHERE id = ? FOR UPDATE', [req.liga.id]);
      if (l[0].status !== 'aguardando') throw erroHttp(409, 'O campeonato já foi gerado');

      const [times] = await conn.query('SELECT id FROM times ORDER BY id');
      if (times.length !== 8) throw new Error('Esperados 8 times no banco (importe db/banco.sql)');
      const tabela = gerarTabela(times.map((t) => t.id));

      const criadas = [];
      for (let i = 0; i < 7; i++) {
        const status = i === 0 ? 'aberta' : 'futura';
        const [r] = await conn.query('INSERT INTO rodadas (liga_id, numero, status) VALUES (?, ?, ?)', [req.liga.id, i + 1, status]);
        criadas.push({ id: r.insertId, numero: i + 1, status });
        for (const jogo of tabela[i]) {
          await conn.query('INSERT INTO partidas (rodada_id, time_casa_id, time_fora_id) VALUES (?, ?, ?)',
            [r.insertId, jogo.casa, jogo.fora]);
        }
      }
      await conn.query("UPDATE ligas SET status = 'em_andamento' WHERE id = ?", [req.liga.id]);
      return criadas;
    });
    res.status(201).json({ rodadas });
  } catch (e) { next(e); }
});

router.get('/:id/rodadas', exigirMembro, async (req, res, next) => {
  try {
    const [r] = await pool.query(
      `SELECT id, numero, status, iniciada_em AS iniciadaEm, finalizada_em AS finalizadaEm
       FROM rodadas WHERE liga_id = ? ORDER BY numero`, [req.liga.id]);
    res.json(r);
  } catch (e) { next(e); }
});

router.get('/:id/rodada-atual', exigirMembro, async (req, res, next) => {
  try {
    const [r] = await pool.query(
      `SELECT * FROM rodadas WHERE liga_id = ?
       AND (status IN ('aberta','em_andamento') OR (? = 'encerrada' AND numero = 7)) LIMIT 1`,
      [req.liga.id, req.liga.status]);
    if (!r.length) return res.json({ rodada: null });
    res.json(await montarRodada(r[0], req.usuario.id));
  } catch (e) { next(e); }
});

router.get('/:id/ranking', exigirMembro, async (req, res, next) => {
  try {
    const [linhas] = await pool.query(
      `SELECT u.id AS usuarioId, u.nome,
              COALESCE(SUM(p.pontos), 0)      AS pontos,
              COALESCE(SUM(p.pontos = 10), 0) AS exatos,
              COALESCE(SUM(p.pontos = 7), 0)  AS setes,
              COALESCE(SUM(p.pontos = 5), 0)  AS cincos,
              COALESCE(SUM(p.pontos = 2), 0)  AS dois
       FROM liga_membros lm
       JOIN usuarios u       ON u.id = lm.usuario_id
       LEFT JOIN rodadas r   ON r.liga_id = lm.liga_id
       LEFT JOIN partidas pa ON pa.rodada_id = r.id
       LEFT JOIN palpites p  ON p.partida_id = pa.id AND p.usuario_id = u.id
       WHERE lm.liga_id = ?
       GROUP BY u.id, u.nome, lm.entrou_em
       ORDER BY pontos DESC, exatos DESC, setes DESC, cincos DESC, lm.entrou_em ASC`, [req.liga.id]);
    res.json(linhas.map((l, i) => ({
      posicao: i + 1,
      usuarioId: l.usuarioId,
      nome: l.nome,
      pontos: Number(l.pontos),
      exatos: Number(l.exatos),
      setes: Number(l.setes),
      cincos: Number(l.cincos),
      dois: Number(l.dois),
      souEu: l.usuarioId === req.usuario.id,
    })));
  } catch (e) { next(e); }
});

router.get('/:id/meus-palpites', exigirMembro, async (req, res, next) => {
  try {
    const [linhas] = await pool.query(
      `SELECT r.id AS rodada_id, r.numero, r.status, pa.id AS partida_id, pa.gols_casa, pa.gols_fora,
              tc.nome AS casa_nome, tc.sigla AS casa_sigla, tf.nome AS fora_nome, tf.sigla AS fora_sigla,
              p.gols_casa AS p_casa, p.gols_fora AS p_fora, p.pontos
       FROM rodadas r
       JOIN partidas pa ON pa.rodada_id = r.id
       JOIN times tc ON tc.id = pa.time_casa_id
       JOIN times tf ON tf.id = pa.time_fora_id
       LEFT JOIN palpites p ON p.partida_id = pa.id AND p.usuario_id = ?
       WHERE r.liga_id = ? AND r.status IN ('finalizada','aberta','em_andamento')
       ORDER BY r.numero, pa.id`, [req.usuario.id, req.liga.id]);
    const rodadas = [];
    for (const l of linhas) {
      let r = rodadas[rodadas.length - 1];
      if (!r || r.id !== l.rodada_id) {
        r = { id: l.rodada_id, numero: l.numero, status: l.status, pontos: 0, jogos: [] };
        rodadas.push(r);
      }
      const finalizada = l.status === 'finalizada';
      r.pontos += l.pontos || 0;
      r.jogos.push({
        casa: { nome: l.casa_nome, sigla: l.casa_sigla },
        fora: { nome: l.fora_nome, sigla: l.fora_sigla },
        golsCasa: finalizada ? l.gols_casa : null,
        golsFora: finalizada ? l.gols_fora : null,
        meuPalpite: l.p_casa === null ? null : { golsCasa: l.p_casa, golsFora: l.p_fora, pontos: l.pontos },
      });
    }
    res.json(rodadas);
  } catch (e) { next(e); }
});

module.exports = router;
