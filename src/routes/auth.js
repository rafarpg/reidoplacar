const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { gerarToken } = require('../autenticar');

const router = express.Router();
const emailValido = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post('/cadastro', async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100)
      return res.status(400).json({ erro: 'Nome deve ter de 2 a 100 caracteres' });
    if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido' });
    if (typeof senha !== 'string' || senha.length < 6)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });

    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length) return res.status(409).json({ erro: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const [r] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email, hash]
    );
    const usuario = { id: r.insertId, nome: nome.trim(), email };
    res.status(201).json({ token: gerarToken(usuario), usuario });
  } catch (e) {
    // e-mail repetido em cadastros simultâneos (chave única)
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail já cadastrado' });
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (typeof email !== 'string' || typeof senha !== 'string')
      return res.status(400).json({ erro: 'Informe e-mail e senha' });

    const [linhas] = await pool.query('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?', [email]);
    const u = linhas[0];
    if (!u || !(await bcrypt.compare(senha, u.senha_hash)))
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

    const usuario = { id: u.id, nome: u.nome, email: u.email };
    res.json({ token: gerarToken(usuario), usuario });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
