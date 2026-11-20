const { pool } = require('./db');

// Depois de autenticar. Carrega a liga (de req.ligaId ou :id), 404 se não existe,
// 403 se o usuário não é membro. Coloca req.liga.
async function exigirMembro(req, res, next) {
  try {
    const id = req.ligaId || req.params.id;
    const [ligas] = await pool.query('SELECT * FROM ligas WHERE id = ?', [id]);
    if (!ligas.length) return res.status(404).json({ erro: 'Liga não encontrada' });
    const [membro] = await pool.query(
      'SELECT 1 FROM liga_membros WHERE liga_id = ? AND usuario_id = ?', [ligas[0].id, req.usuario.id]);
    if (!membro.length) return res.status(403).json({ erro: 'Você não participa desta liga' });
    req.liga = ligas[0];
    next();
  } catch (e) {
    next(e);
  }
}

// Depois de exigirMembro. 403 se não é o dono.
function exigirDono(req, res, next) {
  if (req.liga.dono_id !== req.usuario.id)
    return res.status(403).json({ erro: 'Só o dono da liga pode fazer isso' });
  next();
}

module.exports = { exigirMembro, exigirDono };
