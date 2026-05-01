import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', gender: '', age: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await api.post('/users/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ padding: 24, paddingTop: 50 }}>
      <h2 style={{ color: '#540863', marginBottom: 6 }}>Create Account</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Join the Fitigue community</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Username" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} />
        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
          <option value="">Select Gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <input placeholder="Age" type="number" value={form.age}
          onChange={e => setForm({ ...form, age: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" onClick={handleSubmit}>Register</button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#540863', fontWeight: 600 }}>Login</Link>
      </p>
    </div>
  );
};

export default Register;