import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'white', borderTop: '1px solid #eee',
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 0', zIndex: 100,
    }}>
      {[
        { to: '/marketplace', label: '🏪', text: 'Shop' },
        { to: '/wardrobe',    label: '👗', text: 'Wardrobe' },
        { to: '/profile',     label: '👤', text: 'Profile' },
      ].map(({ to, label, text }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textDecoration: 'none', fontSize: 11, fontWeight: 600,
          color: isActive ? '#540863' : '#aaa', gap: 2,
        })}>
          <span style={{ fontSize: 22 }}>{label}</span>
          {text}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;