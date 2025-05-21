require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db/db');
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


// При подключении клиента
io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    // Клиент просит присоединиться к комнате
    socket.on('join-room', async ({ roomId }) => {
      console.log(`Запрос на вход в комнату ${roomId}`);
      console.log('socket.user:', socket.user);

      try {
        const { rows } = await db.query(
          'SELECT is_private FROM rooms WHERE id = $1',
          [roomId]
        );
        if (!rows.length) {
          return socket.emit('error', 'Room not found');
        }

        const isPrivate = rows[0].is_private;

        if (isPrivate) {
          // ⚠️ если socket.user нет — не даём войти
          if (!socket.user) return socket.emit('error', 'Not authorized');

          const check = await db.query(
            'SELECT 1 FROM room_users WHERE room_id = $1 AND user_id = $2',
            [roomId, socket.user.id]
          );
          if (!check.rows.length) {
            return socket.emit('error', 'No access to private room');
          }
        }

        socket.join(`room-${roomId}`); // ✅ вот это критично
        socket.emit('joined-room', { roomId });
        console.log(`[Server] Socket ${socket.id} joined room-${roomId}`);
      } catch (err) {
        console.error('join-room error:', err);
      }
    });


    // Выход из комнаты
    socket.on('leave-room', ({ roomId }) => {
    socket.leave(`room-${roomId}`);
    socket.emit('left-room', { roomId });
    });


    socket.on('draw', data => {
      socket.broadcast.emit('draw', data);
    });

    socket.on('chat-message', ({ user, text, time }) => {
      const message = { user, text, time };
      io.emit('chat-message', message);
    });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

