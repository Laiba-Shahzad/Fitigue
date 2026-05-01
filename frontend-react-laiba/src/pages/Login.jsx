import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await api.post('/users/login', form);
      login(res.data.user, res.data.token);
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 24, paddingTop: 60 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: '#540863', margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>👗</div>
        <h1 style={{ color: '#540863', fontSize: 26, fontWeight: 700 }}>Fitigue</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Your wardrobe marketplace</p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" onClick={handleSubmit}>Log In</button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#540863', fontWeight: 600 }}>Register</Link>
      </p>
    </div>
  );
};

export default Login;