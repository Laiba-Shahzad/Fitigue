import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Wardrobe = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [posted, setPosted] = useState([]);
  const { user } = useAuth();

  const postToMarket = async (item_id) => {
    if (posted.includes(item_id)) return; // already posted
    try {
      await api.post('/marketplace', { item_id });
      setPosted([...posted, item_id]);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not post to marketplace');
    }
  };
  useEffect(() => {
  const fetchData = async () => {
    const [wardrobeRes, marketRes] = await Promise.all([
      api.get('/wardrobe/my'),
      api.get(`/marketplace/user/${user.user_id}`),  // your own listings
    ]);
    setItems(wardrobeRes.data);
    // collect item_ids already on marketplace
    const alreadyPosted = marketRes.data.map(l => l.item_id);  // make sure item_id is returned
    setPosted(alreadyPosted);
    setLoading(false);
  };
  fetchData();
  }, []);

  const markStatus = async (id, status) => {
    await api.patch(`/wardrobe/${id}/status`, { status });
    setItems(items.map(i => i.item_id === id ? { ...i, status } : i));
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/wardrobe/${id}`);
    setItems(items.filter(i => i.item_id !== id));
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#540863' }}>My Wardrobe</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}
          onClick={() => navigate('/add-item')}>+ Add</button>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading...</p>}
      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <div style={{ fontSize: 40 }}>👗</div>
          <p>No items yet. Add your first item!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.item_id} className="card">
            {item.image_url && (
              <img src={item.image_url} alt={item.title}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.category} · {item.size} · {item.color}</p>
              </div>
              <span style={{ fontWeight: 700, color: '#540863' }}>Rs {item.price}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {item.allow_sale  && <span className="tag">For Sale</span>}
              {item.allow_swap  && <span className="tag">For Swap</span>}
              <span className="tag" style={{
                background: item.status === 'available' ? '#d4edda' : '#f8d7da',
                color: item.status === 'available' ? '#155724' : '#721c24',
              }}>{item.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ flex: 1 }}
              onClick={() => markStatus(item.item_id, item.status === 'available' ? 'sold' : 'available')}>
              {item.status === 'available' ? 'Mark Sold' : 'Mark Available'}
            </button>
            <button
              onClick={() => postToMarket(item.item_id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                background: posted.includes(item.item_id) ? '#d4edda' : '#540863',
                color: posted.includes(item.item_id) ? '#155724' : 'white',
              }}>
              {posted.includes(item.item_id) ? '✓ Posted' : '🏪 Post'}
            </button>
            <button style={{
              background: '#fee', border: 'none', borderRadius: 8,
              padding: '8px 12px', color: '#e74c3c', fontWeight: 600, fontSize: 13,
            }} onClick={() => deleteItem(item.item_id)}>Delete</button>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wardrobe;