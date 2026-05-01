import { useEffect, useState } from 'react';
import api from '../api/axios';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '', size: '', color: '', min_price: '', max_price: '',
    allow_swap: '', allow_sale: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = async (f = {}) => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    const hasFilters = Object.keys(params).length > 0;
    const res = await api.get(hasFilters ? '/marketplace/filter' : '/marketplace', { params });
    setListings(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  const applyFilters = () => { fetchListings(filters); setShowFilters(false); };
  const clearFilters = () => {
    const empty = Object.fromEntries(Object.keys(filters).map(k => [k, '']));
    setFilters(empty);
    fetchListings({});
    setShowFilters(false);
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: '#540863' }}>Marketplace</h2>
        <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
          🔍 Filter
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All Categories</option>
              {['Tops', 'Bottoms', 'Dresses', 'Jackets', 'Shoes', 'Accessories'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={filters.size} onChange={e => setFilters({ ...filters, size: e.target.value })}>
              <option value="">All Sizes</option>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input placeholder="Color" value={filters.color}
              onChange={e => setFilters({ ...filters, color: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Min Price" type="number" value={filters.min_price}
                onChange={e => setFilters({ ...filters, min_price: e.target.value })} />
              <input placeholder="Max Price" type="number" value={filters.max_price}
                onChange={e => setFilters({ ...filters, max_price: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'allow_swap', label: 'Swap Only' },
                { key: 'allow_sale', label: 'Sale Only' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilters({ ...filters, [key]: filters[key] === '1' ? '' : '1' })}
                  style={{
                    flex: 1, padding: 8, borderRadius: 8, fontWeight: 600, fontSize: 12,
                    border: '1.5px solid #540863', cursor: 'pointer',
                    background: filters[key] === '1' ? '#540863' : 'white',
                    color: filters[key] === '1' ? 'white' : '#540863',
                  }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={applyFilters}>Apply</button>
              <button className="btn-outline" style={{ flex: 1 }} onClick={clearFilters}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>Loading...</p>}
      {!loading && listings.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <div style={{ fontSize: 40 }}>🏪</div>
          <p>No listings found.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {listings.map(item => (
          <div key={item.listing_id} className="card">
            {item.image_url && (
              <img src={item.image_url} alt={item.title}
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {item.category} · {item.size} · {item.color}
                </p>
                <p style={{ fontSize: 12, color: '#92487A', marginTop: 2 }}>
                  @{item.username} {item.rating_count ? `(${item.rating_count})` : ''} ⭐ {item.rating_avg || 'N/A'}
                </p>
              </div>
              <span style={{ fontWeight: 700, color: '#540863', fontSize: 16 }}>Rs {item.price}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {item.allow_sale && <span className="tag">For Sale</span>}
              {item.allow_swap && <span className="tag">For Swap</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;