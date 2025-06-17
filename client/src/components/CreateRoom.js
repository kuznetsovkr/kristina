import { useState } from 'react';

export default function CreateRoom({ onRoomCreated }) {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({ name: roomName, is_private: isPrivate }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      const roomId = data.room.id;

      window.history.replaceState(null, '', `?roomId=${roomId}`);
      onRoomCreated(roomId);
      console.log(`Комната создана с ID: ${roomId}`);
      console.log(`Ссылка для приглашения: http://localhost:3000/invite/${data.room.short_id}`);
    } catch (err) {
      console.log('Ошибка создания комнаты: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Название комнаты"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        required
        className="input"
      />
      <label>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="checkbox"
        /> Приватная
      </label>
      <br />
      <button type="submit" className="button" style={{ marginTop: '1rem' }}>
        Создать
      </button>
    </form>
  );
}
