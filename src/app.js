const express = require('express');
const path = require('path');
const { pool } = require('./db');
const { autenticar } = require('./autenticar');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.body = req.body || {}; next(); }); // Express 5: sem corpo, req.body é undefined
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.use('/api/ligas', require('./routes/ligas'));
app.use('/api/rodadas', require('./routes/rodadas'));
app.get('/api/times', autenticar, async (req, res, next) => {
  try {
    const [times] = await pool.query('SELECT id, nome, sigla FROM times ORDER BY id');
    res.json(times);
  } catch (e) { next(e); }
});

app.get('/api/saude', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, banco: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, erro: 'Banco indisponível' });
  }
});

// Erros inesperados: loga no console e responde 500 genérico
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'Dados inválidos' });
  if (err.status) return res.status(err.status).json({ erro: err.message });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
});

module.exports = app;
