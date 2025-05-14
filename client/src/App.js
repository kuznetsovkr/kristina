import React, { useState, useEffect } from 'react';
import Login from './Login';
import Canvas from './Canvas';

function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [joiningId, setJoiningId] = useState('');
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  // При загрузке читаем roomId из query-параметров
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('roomId');
    if (id) {
      setRoomId(Number(id));
    }
  }, []);

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  if (!roomId) {
    return (
      <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
        <h2>Комнаты</h2>
        {!creating ? (
          <button onClick={() => setCreating(true)} style={{ marginBottom: '1rem' }}>
            Создать новую комнату
          </button>
        ) : (
          <form
            onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await fetch('http://localhost:3001/api/rooms', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                  },
                  body: JSON.stringify({ name: roomName, is_private: isPrivate })
                });
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(errText);
                }
                const data = await res.json();
                // Обновляем URL, добавляем ?roomId=
                window.history.replaceState(null, '', `?roomId=${data.room.id}`);
                setRoomId(data.room.id);
                alert(`Комната создана с ID: ${data.room.id}`);
              } catch (err) {
                alert('Ошибка создания комнаты: ' + err.message);
              }
            }}>
            <input
              type="text"
              placeholder="Название комнаты"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              required
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
              /> Приватная
            </label>
            <br />
            <button type="submit" style={{ marginTop: '0.5rem' }}>Создать</button>
          </form>
        )}
        <div style={{ marginTop: '2rem' }}>
          <h3>Или присоединиться к существующей комнате</h3>
          <input
            type="number"
            placeholder="Room ID"
            value={joiningId}
            onChange={e => setJoiningId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
          <button
            onClick={() => {
              setRoomId(Number(joiningId));
              window.history.replaceState(null, '', `?roomId=${joiningId}`);
            }}
            style={{ width: '100%' }}
          >
            Присоединиться
          </button>
        </div>
      </div>
    );
  }

  return <Canvas roomId={roomId} />;
}

export default App;