export default function Header({ user, onLogout }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo} onClick={() => window.location.href = '/'}>
        Лого
      </div>
      <div>
        {user ? (
          <button onClick={onLogout} style={styles.button}>Выйти</button>
        ) : (
          <button onClick={() => window.location.href = '/'} style={styles.button}>Войти</button>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '60px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.25rem',
    cursor: 'pointer'
  },
  button: {
    padding: '0.5rem 1rem',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
