export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p>
        Связь: <a href="mailto:support@example.com">support@example.com</a>
      </p>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #ddd',
    padding: '1rem',
    textAlign: 'center',
    marginTop: 'auto'
  }
};
