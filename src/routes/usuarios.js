const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { autenticar } = require('../autenticar');

const router = express.Router();
router.use(autenticar);
const emailValido = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.get('/me', async (req, res, next) => {
  try {
    const [l] = await pool.query('SELECT id, nome, email, criado_em AS criadoEm FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!l.length) return res.status(401).json({ erro: 'Usuário não existe mais' });
    res.json(l[0]);
  } catch (e) {
    next(e);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const { nome, email, senhaAtual, novaSenha } = req.body;
    if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100)
      return res.status(400).json({ erro: 'Nome deve ter de 2 a 100 caracteres' });
    if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido' });

    const [l] = await pool.query('SELECT senha_hash FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!l.length) return res.status(401).json({ erro: 'Usuário não existe mais' });

    const [outro] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND id <> ?', [email, req.usuario.id]);
    if (outro.length) return res.status(409).json({ erro: 'E-mail já cadastrado' });

    let hash = l[0].senha_hash;
    if (novaSenha) {
      if (typeof novaSenha !== 'string' || novaSenha.length < 6)
        return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres' });
      if (typeof senhaAtual !== 'string' || !(await bcrypt.compare(senhaAtual, hash)))
        return res.status(400).json({ erro: 'Senha atual incorreta' });
      hash = await bcrypt.hash(novaSenha, 10);
    }

    await pool.query('UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?',
      [nome.trim(), email, hash, req.usuario.id]);
    res.json({ usuario: { id: req.usuario.id, nome: nome.trim(), email } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail já cadastrado' });
    next(e);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    const { senha } = req.body;
    const [l] = await pool.query('SELECT senha_hash FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!l.length) return res.status(401).json({ erro: 'Usuário não existe mais' });
    if (typeof senha !== 'string' || !(await bcrypt.compare(senha, l[0].senha_hash)))
      return res.status(400).json({ erro: 'Senha incorreta' });
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.usuario.id]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
