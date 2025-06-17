import { useState } from 'react';

export default function JoinRoom({ onJoin }) {
  const [joiningId, setJoiningId] = useState('');

  const handleJoin = () => {
    const roomId = joiningId.trim();

    if (!roomId) {
      console.log('Введите ID комнаты');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      console.log('Неверный формат ID комнаты');
      return;
    }

    window.history.replaceState(null, '', `?roomId=${roomId}`);
    onJoin(roomId);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 className="subtitle">Или присоединиться к существующей комнате</h3>
      <input
        type="text"
        placeholder="ID комнаты (UUID)"
        value={joiningId}
        onChange={(e) => setJoiningId(e.target.value)}
        className="input"
      />
      <button
        onClick={handleJoin}
        className="button"
        style={{ width: '100%' }}
      >
        Присоединиться
      </button>
    </div>
  );
}
