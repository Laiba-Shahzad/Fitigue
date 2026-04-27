import { useState, useEffect, useCallback } from 'react';
import { getTradeHistory, getSwapHistory, getTradeStatusCount, cancelTrade } from '../api';

function timeAgo(str) {
  const m = Math.floor((Date.now() - new Date(str)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TradeHistory() {
  const [view, setView]         = useState('trades'); // 'trades' | 'swaps'
  const [trades, setTrades]     = useState([]);
  const [swaps, setSwaps]       = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };

  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([getTradeHistory(), getTradeStatusCount()]);
      setTrades(t); setStatusCounts(s);
    } catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  const loadSwaps = useCallback(async () => {
    setLoading(true);
    try { setSwaps(await getSwapHistory()); }
    catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (view === 'trades') loadTrades();
    else loadSwaps();
  }, [view, loadTrades, loadSwaps]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this trade?')) return;
    try { await cancelTrade(id); loadTrades(); }
    catch (e) { flash(e.message, 'error'); }
  };

  return (
    <div className="page">
      <div className="panel-header">
        <h2>My History</h2>
        <div className="toggle-group">
          <button className={`toggle ${view === 'trades' ? 'active' : ''}`} onClick={() => setView('trades')}>Trades</button>
          <button className={`toggle ${view === 'swaps'  ? 'active' : ''}`} onClick={() => setView('swaps')}>Swaps</button>
        </div>
      </div>

      {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}

      {view === 'trades' && (
        <div className="status-chips">
          {statusCounts.map(s => (
            <span key={s.status} className={`chip ${s.status}`}>{s.status}: {s.count}</span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : view === 'trades' ? (
        trades.length === 0 ? <p className="empty">No trade history yet.</p> : (
          <div className="feed">
            {trades.map(t => (
              <div key={t.trade_id} className="card">
                <div className="h-header">
                  <span className={`action-badge ${t.action}`}>{t.action}</span>
                  <span className="h-title">{t.title}</span>
                  <span className={`status-${t.status}`}>{t.status}</span>
                </div>
                <div className="h-sub">
                  <span> {t.category || '—'}</span>
                  <span> {t.price != null ? `$${t.price}` : '—'}</span>
                  <span> {t.other_party}</span>
                  <span> {t.trade_type || '—'}</span>
                  <span> {new Date(t.trade_date).toLocaleDateString()}</span>
                </div>
                {t.status === 'pending' && (
                  <button className="cancel-btn" onClick={() => handleCancel(t.trade_id)}>Cancel Trade</button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        swaps.length === 0 ? <p className="empty">No swap history yet.</p> : (
          <div className="feed">
            {swaps.map(s => (
              <div key={s.swap_id} className="card">
                <div className="s-header">
                  <span className="s-title"> {s.item_wanted} ↔ {s.item_offered}</span>
                  <span className={`status-${s.status}`}>{s.status}</span>
                </div>
                <div className="s-sub">
                  👤 with {s.other_user} · 📅 {timeAgo(s.created_at)}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}