import React, { useRef, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import Chat from './Chat'; 

export default function Canvas({ roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const [tool, setTool] = useState('brush');
  const [brushColor, setBrushColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(5);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'canvas.png';
    link.click();
  };

  useEffect(() => {
    if (!roomId) return;
    console.log('[Canvas] эмитим join-room', roomId);
    socket.emit('join-room', { roomId });
    socket.once('joined-room', ({ roomId: rid }) =>
      console.log(`[Canvas] получили joined-room ${rid}`)
    );
    socket.on('joined-room', ({ roomId: rid }) => console.log(`Joined room ${rid}`));
    socket.on('draw', ({ x0, y0, x1, y1, color, size, tool }) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (tool === 'brush' || tool === 'eraser') {
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('joined-room');
      socket.off('draw');
    };
  }, [roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = (tool === 'select') ? 1 : brushSize;
    const radius = size / 2;
    const color = tool === 'fill' ? fillColor.replace('#','%23') : brushColor.replace('#','%23');
    const bg = tool === 'eraser' ? '%23fff' : color;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${radius}' cy='${radius}' r='${radius}' fill='${bg}'/></svg>`;
    canvas.style.cursor = `url("data:image/svg+xml;utf8,${svg}") ${radius} ${radius}, auto`;
  }, [brushSize, brushColor, fillColor, tool]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setLastPos({ x: offsetX, y: offsetY });
    setDrawing(true);

    if (tool === 'fill') {
      handleFill(offsetX, offsetY);
      setDrawing(false);
    }
    if (tool === 'select') {
      setSelectionStart({ x: offsetX, y: offsetY });
      setSelectionRect(null);
    }
  };

  const draw = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if ((tool === 'brush' || tool === 'eraser') && drawing) {
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';

      socket.emit('draw', { roomId, x0: lastPos.x, y0: lastPos.y, x1: offsetX, y1: offsetY, color: brushColor, size: brushSize, tool });
      setLastPos({ x: offsetX, y: offsetY });
    }

    if (tool === 'select' && drawing && selectionStart) {
      const x = Math.min(selectionStart.x, offsetX);
      const y = Math.min(selectionStart.y, offsetY);
      const w = Math.abs(offsetX - selectionStart.x);
      const h = Math.abs(offsetY - selectionStart.y);
      setSelectionRect({ x, y, w, h });
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    if (tool === 'select' && selectionRect) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      ctx.restore();
    }
  };

  const handleFill = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const targetColor = getColorAtPixel(imageData, x, y);
    const fillRGBA = hexToRgba(fillColor);
    floodFill(imageData, x, y, targetColor, fillRGBA);
    ctx.putImageData(imageData, 0, 0);
  };

  const getColorAtPixel = (data, x, y) => {
    const idx = (y * data.width + x) * 4;
    return [data.data[idx], data.data[idx+1], data.data[idx+2], data.data[idx+3]];
  };

  const hexToRgba = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
  };

  const floodFill = (imageData, x, y, targetColor, fillColor) => {
    const stack = [[x, y]];
    const { width, height, data } = imageData;
    const match = (idx) => data[idx] === targetColor[0] && data[idx+1] === targetColor[1] && data[idx+2] === targetColor[2] && data[idx+3] === targetColor[3];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const idx = (cy * width + cx) * 4;
      if (!match(idx)) continue;
      data[idx] = fillColor[0]; data[idx+1] = fillColor[1]; data[idx+2] = fillColor[2]; data[idx+3] = fillColor[3];
      if (cx > 0) stack.push([cx-1, cy]);
      if (cx < width-1) stack.push([cx+1, cy]);
      if (cy > 0) stack.push([cx, cy-1]);
      if (cy < height-1) stack.push([cx, cy+1]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f9f9f9', minHeight: '100vh', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', padding: 15, borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 20 }}>
        <label>
          Инструмент:
          <select value={tool} onChange={e => setTool(e.target.value)} style={{ marginLeft: 8 }}> 
            <option value="brush">Кисть</option>
            <option value="eraser">Ластик</option>
            <option value="fill">Заливка</option>
            <option value="select">Выделение</option>
          </select>
        </label>
        {(tool === 'brush' || tool === 'eraser') && (
          <>
            <label>
              Цвет:
              <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
            <label>
              Размер:
              <input type="range" min={1} max={50} value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ marginLeft: 8 }} />
              <span style={{ marginLeft: 5 }}>{brushSize}px</span>
            </label>
          </>
        )}
        {tool === 'fill' && (
          <label>
            Цвет заливки:
            <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} style={{ marginLeft: 8 }} />
          </label>
        )}
        <button onClick={handleSave} style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#4f46e5', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
          Сохранить
        </button>
      </div>

      <p style={{ marginBottom: 10 }}>Вы в комнате: <strong>{roomId}</strong></p>
      <div  style={{ display: 'flex'}}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: '2px solid #ddd', borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <Chat roomId={roomId} user={JSON.parse(localStorage.getItem('user'))} />

      </div>
    </div>
  );
}
