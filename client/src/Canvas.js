import React, { useRef, useEffect, useState } from 'react';
import { socket } from './socket';

export default function Canvas({ roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!roomId) return;

    socket.emit('join-room', { roomId });
    socket.on('joined-room', ({ roomId: rid }) => {
      console.log(`Joined room ${rid}`);
    });
    socket.on('draw', ({ x0, y0, x1, y1, color, size }) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('joined-room');
      socket.off('draw');
    };
  }, [roomId]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setLastPos({ x: offsetX, y: offsetY });
    setDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    socket.emit('draw', {
      roomId,
      x0: lastPos.x,
      y0: lastPos.y,
      x1: offsetX,
      y1: offsetY,
      color: '#000',
      size: 2
    });

    setLastPos({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => setDrawing(false);

  return (
    <div>
      <p>Вы в комнате: <strong>{roomId}</strong></p>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}