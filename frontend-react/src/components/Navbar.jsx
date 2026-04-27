import { useAuth } from '../context/AuthContext';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();

  const links = [
    { id: 'purchases', label: '💳 Purchases' },
    { id: 'swaps',     label: '🔄 Swaps'     },
    { id: 'chat',      label: '💬 Chat'       },
  ];

  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>👗 Fitigue</span>
      <div style={styles.links}>
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => setPage(l.id)}
            style={{ ...styles.link, ...(page === l.id ? styles.linkActive : {}) }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div style={styles.right}>
        {user && <span style={styles.username}>Hi, {user.username}</span>}
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav:        { display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px', height: 60, background: '#1a1a2e', fontFamily: "'Segoe UI', sans-serif" },
  logo:       { fontSize: 20, fontWeight: 800, color: '#fff', marginRight: 24 },
  links:      { display: 'flex', gap: 4, flex: 1 },
  link:       { background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '6px 14px', borderRadius: 8 },
  linkActive: { background: 'rgba(255,255,255,0.15)', color: '#fff' },
  right:      { display: 'flex', alignItems: 'center', gap: 12 },
  username:   { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  logoutBtn:  { background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
};