import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AddItem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', size: '',
    color: '', price: '', allow_sale: 0, allow_swap: 0,
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (image) data.append('image', image);
      await api.post('/wardrobe', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/wardrobe');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer'
        }}>←</button>
        <h2 style={{ color: '#540863' }}>Add Item</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Description" rows={3} value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #ddd', fontFamily: 'inherit', fontSize: 14 }} />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="">Category</option>
          {['Tops', 'Bottoms', 'Dresses', 'Jackets', 'Shoes', 'Accessories'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
          <option value="">Size</option>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input placeholder="Color" value={form.color}
          onChange={e => setForm({ ...form, color: e.target.value })} />
        <input placeholder="Price (Rs)" type="number" value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })} />

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { key: 'allow_sale', label: 'For Sale' },
            { key: 'allow_swap', label: 'For Swap' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setForm({ ...form, [key]: form[key] ? 0 : 1 })}
              style={{
                flex: 1, padding: 10, borderRadius: 8, fontWeight: 600, fontSize: 13,
                border: '1.5px solid #540863', cursor: 'pointer',
                background: form[key] ? '#540863' : 'white',
                color: form[key] ? 'white' : '#540863',
              }}>{label}</button>
          ))}
        </div>

        {/* Image Upload */}
        <div style={{
          border: '1.5px dashed #ddd', borderRadius: 10, padding: 16,
          textAlign: 'center', color: '#888', fontSize: 13,
        }}>
          <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])}
            style={{ display: 'none' }} id="img-upload" />
          <label htmlFor="img-upload" style={{ cursor: 'pointer' }}>
            {image ? `📷 ${image.name}` : '📷 Tap to upload image'}
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn-primary" onClick={handleSubmit}>Add to Wardrobe</button>
      </div>
    </div>
  );
};

export default AddItem;