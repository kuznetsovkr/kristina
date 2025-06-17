import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InviteHandler({ onRoomEnter }) {
  const { shortId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/rooms/by-invite/${shortId}`);
        if (!res.ok) throw new Error('Комната не найдена');
        const data = await res.json();

        navigate(`/?roomId=${data.roomId}`);
        onRoomEnter(data.roomId);
      } catch (err) {
        alert(err.message);
        navigate('/');
      }
    };

    fetchRoom();
  }, [shortId, navigate, onRoomEnter]);

  return <p>Переход по приглашению...</p>;
}
