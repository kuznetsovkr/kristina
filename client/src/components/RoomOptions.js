import React, { useState, useEffect } from 'react';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import Login from './Login';

export default function RoomOptions({ onRoomEnter, user, setUser }) {
  const [creating, setCreating] = useState(false);

  // Автоматическое восстановление юзера из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  // При логине сохраняем в localStorage
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <>
      {!user && (
        <div style={overlayStyle}>
          <Login onSuccess={handleLogin} />
        </div>
      )}

      <div className="container" style={{ filter: !user ? 'blur(3px)' : 'none' }}>
        <h2 className="title">Комнаты</h2>

        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="button"
            style={{ marginBottom: '1rem' }}
          >
            Создать новую комнату
          </button>
        ) : (
          <CreateRoom onRoomCreated={onRoomEnter} />
        )}

        <JoinRoom onJoin={onRoomEnter} />
      </div>
    </>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};
