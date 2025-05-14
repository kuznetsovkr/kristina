const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Создать комнату
router.post('/', auth, async (req, res) => {
  const { name, is_private } = req.body;
  const owner_id = req.user.id;
  try {
    const { rows } = await db.query(
      `INSERT INTO rooms (name, is_private, owner_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, is_private, owner_id]
    );
    res.json({ room: rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Получить список публичных комнат
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, owner_id, created_at FROM rooms WHERE is_private = FALSE'
  );
  res.json({ rooms: rows });
});

module.exports = router;
