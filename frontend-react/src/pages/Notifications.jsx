import { useState, useEffect, useCallback } from 'react';
import { getAllNotifications, getUnreadNotifications, markNotifRead, deleteReadNotifications } from '../api';

const LABELS = {
  new_message:  'New Message',
  swap_request: 'Swap Request',
  trade_update: 'Trade Update',
  new_rating:   'New Rating',
};

function timeAgo(str) {
  const m = Math.floor((Date.now() - new Date(str)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const [mode, setMode]           = useState('all');
  const [notifs, setNotifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifs(mode === 'unread' ? await getUnreadNotifications() : await getAllNotifications());
    } catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await markNotifRead(id);
      setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
    } catch (e) { flash(e.message, 'error'); }
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications();
      flash('Read notifications cleared.', 'success');
      load();
    } catch (e) { flash(e.message, 'error'); }
  };

  return (
    <div className="page">
      <div className="panel-header">
        <h2>Notifications</h2>
        <div className="toggle-group">
          <button className={`toggle ${mode === 'all'    ? 'active' : ''}`} onClick={() => setMode('all')}>All</button>
          <button className={`toggle ${mode === 'unread' ? 'active' : ''}`} onClick={() => setMode('unread')}>Unread</button>
        </div>
        <button className="btn-ghost danger" onClick={handleClearRead}>Clear Read</button>
      </div>

      {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : notifs.length === 0 ? (
        <p className="empty">No {mode === 'unread' ? 'unread ' : ''}notifications.</p>
      ) : (
        <div className="feed">
          {notifs.map(n => (
            <div
              key={n.notification_id}
              className="card notif-card"
              onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
            >
              <span className={`notif-dot ${n.is_read ? 'read' : ''}`} />
              <div>
                <div className="notif-type">{LABELS[n.type] || n.type}</div>
                <div className="notif-meta">Ref #{n.reference_id || '—'} · {timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}