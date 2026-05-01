import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/users/profile/me').then(res => {
      setProfile(res.data);
      setForm({ username: res.data.username, age: res.data.age, profile_image: res.data.profile_image });
    });
  }, []);

  const handleSave = async () => {
    await api.put('/users/profile', form);
    setProfile({ ...profile, ...form });
    setEditing(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;

    await api.delete('/users/profile');
    logout();
    navigate('/login');
  };

  if (!profile) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: '#540863', borderRadius: 16, padding: 20, color: 'white', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#92487A', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>👤</div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>{profile.username}</h2>
            <p style={{ fontSize: 12, opacity: 0.8 }}>{profile.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          {[
            { label: 'Trades', value: profile.total_trades || 0 },
            { label: 'Rating', value: profile.rating_avg ? `${profile.rating_avg}⭐` : 'N/A' },
            { label: 'Items', value: profile.wardrobe_count || 0 },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginBottom: 12, color: '#540863' }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
            <input placeholder="Age" type="number" value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleSave}>Save</button>
              <button className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
          <button className="btn-outline" onClick={() => navigate('/wardrobe')}>👗 My Wardrobe</button>
          <button style={{
            background: 'transparent', border: '1.5px solid #e74c3c',
            color: '#e74c3c', padding: '10px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
          }} onClick={handleLogout}>🚪 Logout</button>
          <button style={{
            background: '#e74c3c', border: '1.5px solid #c0392b',
            color: 'white', padding: '10px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
          }} onClick={handleDeleteAccount}>🗑️ Delete Account</button>
        </div>
      )}
    </div>
  );
};

export default Profile;