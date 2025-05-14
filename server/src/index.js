require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const authRouter = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const jwt = require('jsonwebtoken');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' }
});


// При подключении клиента
io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    // Получаем событие рисования и пересылаем всем остальным
    socket.on('draw', data => {
        socket.broadcast.emit('draw', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    // Клиент просит присоединиться к комнате
    socket.on('join-room', async ({ roomId }) => {
    // проверка, есть ли право зайти (если private)
    const { rows } = await db.query(
        'SELECT is_private FROM rooms WHERE id = $1', [roomId]
    );
    if (!rows.length) return socket.emit('error', 'Room not found');
    if (rows[0].is_private) {
        // можно добавить проверку, есть ли пользователь в room_users
        const check = await db.query(
        'SELECT 1 FROM room_users WHERE room_id=$1 AND user_id=$2',
        [roomId, socket.user.id]
        );
        if (!check.rows.length) {
        return socket.emit('error', 'No access to private room');
        }
    }

    socket.join(`room-${roomId}`);
    // запишем в историю участников
    await db.query(
        `INSERT INTO room_users (room_id, user_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING`,
        [roomId, socket.user.id]
    );
    socket.emit('joined-room', { roomId });
    });

    // Выход из комнаты
    socket.on('leave-room', ({ roomId }) => {
    socket.leave(`room-${roomId}`);
    socket.emit('left-room', { roomId });
    });

    // При рисовании шлём только участникам комнаты
    socket.on('draw', data => {
    const { roomId, ...drawData } = data;
    socket.to(`room-${roomId}`).emit('draw', { ...drawData, user: socket.user.username });
    });

});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;       // сохраняем инфо о пользователе на сокете
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

