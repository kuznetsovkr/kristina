const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db/db');
const crypto = require('crypto');
const shortId = generateShortId();

const router = express.Router();

function generateShortId() {
  return crypto.randomBytes(4).toString('hex');
}

async function generateUniqueShortId() {
  while (true) {
    const id = crypto.randomBytes(4).toString('hex');
    const { rows } = await db.query('SELECT 1 FROM rooms WHERE short_id = $1', [id]);
    if (rows.length === 0) return id;
  }
}

router.post('/', auth, async (req, res) => {
  const { name, is_private } = req.body;
  const owner_id = req.user.id;

  try {
    const shortId = await generateUniqueShortId();

    const { rows } = await db.query(
      `INSERT INTO rooms (id, name, is_private, owner_id, short_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [name, is_private, owner_id, shortId]
    );

    res.json({ room: rows[0] });
  } catch (err) {
    console.error('ROOM CREATE ERROR:', err);
    res.status(400).json({ error: err.message });
  }
});


router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, owner_id, created_at FROM rooms WHERE is_private = FALSE'
  );
  res.json({ rooms: rows });
});

router.get('/by-invite/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT id FROM rooms WHERE short_id = $1',
      [shortId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Комната не найдена' });

    res.json({ roomId: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


module.exports = router;
