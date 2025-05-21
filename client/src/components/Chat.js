import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';

export default function Chat({ roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);


    useEffect(() => {
        if (!roomId) return;
        socket.emit('join-room', { roomId });
        console.log('[Chat] init socket chat-message…');
        const handler = (msg) => {
            console.log('[Chat] Пришло сообщение:', msg);
            setMessages(prev => [...prev, msg]);
        };

        socket.on('chat-message', handler);

        return () => {
            console.log('[Chat] Отключение подписки');
            socket.off('chat-message', handler);
        };
    }, [roomId]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (text.trim()) {
      const msg = {
        roomId,
        user: user?.username || 'Гость',
        text,
        time: new Date().toLocaleTimeString().slice(0, 5),
      };
      socket.emit('chat-message', msg);
      setText('');
    }
  };

  return (
    <div style={styles.chat}>
      <div style={styles.messages}>
        {messages.map((msg, idx) => (
          <div key={idx} style={styles.message}>
            <strong>{msg.user}</strong> [{msg.time}]: {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button style={styles.button} onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}

const styles = {
  chat: {
    width: 300,
    height: 600,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ccc',
    borderRadius: 8,
    marginLeft: 20,
    backgroundColor: '#fff',
  },
  messages: {
    flex: 1,
    padding: 10,
    overflowY: 'auto',
  },
  message: {
    marginBottom: 8,
    fontSize: '0.9rem',
  },
  inputContainer: {
    display: 'flex',
    borderTop: '1px solid #eee',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderRadius: '0 0 0 8px',
    outline: 'none',
  },
  button: {
    padding: '0.5rem 1rem',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '0 0 8px 0',
    cursor: 'pointer',
  }
};
