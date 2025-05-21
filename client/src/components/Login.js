import React, { useState } from 'react';

const styles = {
  container: {
    maxWidth: 400,
    margin: '0',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  input: {
    width: '90%',
    padding: '0.5rem',
    marginBottom: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    margin: '0.5rem 0',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  toggleLink: {
    color: '#4f46e5',
    cursor: 'pointer',
    marginTop: '1rem',
    display: 'inline-block'
  }
};

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegistering ? 'register' : 'login';

    try {
      const res = await fetch(`http://localhost:3001/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (!isRegistering) {
        localStorage.setItem('token', data.token);
        onSuccess(data.user);
      } else {
        setIsRegistering(false);
        console.log('Регистрация прошла успешно. Войдите в систему.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isRegistering ? 'Регистрация' : 'Авторизация'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          style={styles.input}
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={styles.button} type="submit">
          {isRegistering ? 'Зарегистрироваться' : 'Войти'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <span
        style={styles.toggleLink}
        onClick={() => setIsRegistering(!isRegistering)}
      >
        {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрируйтесь'}
      </span>
    </div>
  );
}
