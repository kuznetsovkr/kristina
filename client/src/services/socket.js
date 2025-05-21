import { io } from 'socket.io-client';
const token = localStorage.getItem('token');
export const socket = io('http://localhost:3001', {
  auth: { token },
  transports: ['websocket']
});
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});
socket.on('connect_error', (err) => {
  console.error('Socket connect_error:', err.message);
});
