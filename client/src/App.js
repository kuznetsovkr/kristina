import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import InviteHandler from './components/InviteHandler'; // создадим чуть позже
import Canvas from './components/Canvas';
import RoomOptions from './components/RoomOptions';
import Header from './components/Header';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [showRoomOptions, setShowRoomOptions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRoomId(null);
    setShowRoomOptions(false);
  };

  const renderContent = () => {

    if (!roomId) {
      if (!showRoomOptions) {
        return (
          <div className="container">
            <h1 className="title">Добро пожаловать!</h1>
            <button
              className="button"
              onClick={() => setShowRoomOptions(true)}
            >
              Начать рисовать
            </button>
          </div>
        );
      }

      return <RoomOptions  onRoomEnter={setRoomId} user={user} setUser={setUser} />;
    }

    return <Canvas roomId={roomId} />;
  };

  // На самой первой странице (без юзера или без showRoomOptions) хедер скрываем
  const shouldShowHeader = user && (roomId || showRoomOptions);

  return (
    <>
      {shouldShowHeader && <Header user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={renderContent()} />
        <Route path="/invite/:shortId" element={
          <InviteHandler onRoomEnter={setRoomId} />
        } />
      </Routes>
    </>
  );
}

export default App;
