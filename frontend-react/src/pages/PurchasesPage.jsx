import { useState, useEffect } from 'react';
import { buyItem, getMyPurchases, getMySales } from '../services/api';

export default function PurchasesPage() {
  const [tab, setTab]           = useState('purchases'); // 'purchases' | 'sales' | 'buy'
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Buy form state
  const [buyForm, setBuyForm] = useState({ item_id: '', seller_id: '' });

  // ── Fetch purchases & sales on mount ──────────────────────────
  useEffect(() => {
    fetchPurchases();
    fetchSales();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await getMyPurchases();
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await getMySales();
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Handle buy form submit ─────────────────────────────────────
  const handleBuy = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await buyItem({
        item_id:   parseInt(buyForm.item_id),
        seller_id: parseInt(buyForm.seller_id),
      });
      setSuccess(`Purchase successful! Trade ID: ${res.data.trade_id}`);
      setBuyForm({ item_id: '', seller_id: '' });
      fetchPurchases();
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>💳 Purchases & Sales</h1>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {['buy', 'purchases', 'sales'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t === 'buy' ? '🛒 Buy Item' : t === 'purchases' ? '📦 My Purchases' : '💰 My Sales'}
          </button>
        ))}
      </div>

      {/* ── BUY FORM ─────────────────────────────────────────── */}
      {tab === 'buy' && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Buy an Item</h2>
          {error   && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.successMsg}>{success}</div>}
          <form onSubmit={handleBuy} style={styles.form}>
            <label style={styles.label}>Item ID</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Enter item_id"
              value={buyForm.item_id}
              onChange={(e) => setBuyForm({ ...buyForm, item_id: e.target.value })}
              required
            />
            <label style={styles.label}>Seller ID</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Enter seller_id"
              value={buyForm.seller_id}
              onChange={(e) => setBuyForm({ ...buyForm, seller_id: e.target.value })}
              required
            />
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </form>
        </div>
      )}

      {/* ── MY PURCHASES ─────────────────────────────────────── */}
      {tab === 'purchases' && (
        <div>
          {purchases.length === 0
            ? <p style={styles.empty}>No purchases yet.</p>
            : purchases.map((p) => (
              <div key={p.trade_id} style={styles.card}>
                <div style={styles.rowBetween}>
                  <span style={styles.itemTitle}>{p.title}</span>
                  <span style={styles.badge('green')}>PKR {p.price}</span>
                </div>
                <p style={styles.meta}>Category: {p.category} &nbsp;|&nbsp; Color: {p.color}</p>
                <p style={styles.meta}>Seller: <strong>{p.seller}</strong></p>
                <p style={styles.meta}>Date: {formatDate(p.trade_date)}</p>
                <span style={styles.statusPill(p.status)}>{p.status}</span>
              </div>
            ))
          }
        </div>
      )}

      {/* ── MY SALES ─────────────────────────────────────────── */}
      {tab === 'sales' && (
        <div>
          {sales.length === 0
            ? <p style={styles.empty}>No sales yet.</p>
            : sales.map((s) => (
              <div key={s.trade_id} style={styles.card}>
                <div style={styles.rowBetween}>
                  <span style={styles.itemTitle}>{s.title}</span>
                  <span style={styles.badge('blue')}>PKR {s.price}</span>
                </div>
                <p style={styles.meta}>Buyer: <strong>{s.buyer}</strong></p>
                <p style={styles.meta}>Date: {formatDate(s.trade_date)}</p>
                <span style={styles.statusPill(s.status)}>{s.status}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Inline styles ──────────────────────────────────────────────
const styles = {
  page:      { maxWidth: 700, margin: '0 auto', padding: '32px 16px', fontFamily: "'Segoe UI', sans-serif" },
  heading:   { fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' },
  tabBar:    { display: 'flex', gap: 8, marginBottom: 24 },
  tab:       { padding: '10px 20px', border: '2px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600, color: '#555', transition: 'all 0.2s' },
  tabActive: { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  card:      { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' },
  form:      { display: 'flex', flexDirection: 'column', gap: 12 },
  label:     { fontWeight: 600, fontSize: 13, color: '#444' },
  input:     { padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn:       { padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  error:     { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 8, fontSize: 14 },
  successMsg:{ background: '#f0fff4', color: '#27ae60', padding: '10px 14px', borderRadius: 8, marginBottom: 8, fontSize: 14 },
  rowBetween:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: 700, fontSize: 16, color: '#1a1a2e' },
  meta:      { fontSize: 13, color: '#666', margin: '3px 0' },
  empty:     { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 15 },
  badge:     (c) => ({ background: c === 'green' ? '#e8f5e9' : '#e3f2fd', color: c === 'green' ? '#2e7d32' : '#1565c0', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: 13 }),
  statusPill:(s) => ({ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s === 'completed' ? '#e8f5e9' : '#fff8e1', color: s === 'completed' ? '#2e7d32' : '#f57f17' }),
};