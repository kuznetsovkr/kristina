const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  console.log('BODY REGISTER:', req.body);
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('REGISTRATION ERROR:', err);
    return res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  if (!rows.length) return res.status(400).json({ error: 'Неверные данные' });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(400).json({ error: 'Неверные данные' });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '12h'
  });
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, username FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length) return res.sendStatus(404);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('JWT ERROR:', err.message);
    return res.sendStatus(401);
  }
});


module.exports = router;
