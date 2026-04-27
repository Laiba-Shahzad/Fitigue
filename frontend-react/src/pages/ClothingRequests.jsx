import { useState, useEffect, useCallback } from 'react';
import { getClothingRequests, postClothingRequest, deleteClothingRequest } from '../api';

const USER_ID = () => Number(localStorage.getItem('user_id')) || 0;

function timeAgo(str) {
  const m = Math.floor((Date.now() - new Date(str)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function stars(avg) { 
  const n = Math.round(avg || 0); 
  return '★'.repeat(n) + '☆'.repeat(5 - n); 
}

export default function ClothingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc]         = useState('');
  const [msg, setMsg]           = useState(null);
  const [posting, setPosting]   = useState(false);

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await getClothingRequests()); }
    catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    if (!desc.trim()) 
      return flash('Please enter a description.', 'error');
    setPosting(true);
    try {
      await postClothingRequest(desc.trim());
      setDesc(''); setShowForm(false);
      flash('Request posted!', 'success');
      load();
    } catch (e) { flash(e.message, 'error'); }
    finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this request?')) return;
    try { await deleteClothingRequest(id); load(); }
    catch (e) { flash(e.message, 'error'); }
  };

  return (
    <div className="page">
      <div className="panel-header">
        <h2>Clothing Requests</h2>
        <button className="btn-ghost" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Close' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label className="form-label">Describe what you're looking for</label>
          <textarea
            className="form-textarea" rows={3}
            placeholder="e.g. Vintage bomber jacket, size M, any colour…"
            value={desc} onChange={e => setDesc(e.target.value)}
          />
          <div className="form-actions">
            <button className="btn-primary" onClick={handlePost} disabled={posting}>
              {posting ? 'Posting…' : 'Post Request'}
            </button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setDesc(''); }}>Cancel</button>
          </div>
          {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
        </div>
      )}

      {!showForm && msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="empty">No requests yet. Be the first!</p>
      ) : (
        <div className="feed">
          {requests.map(r => (
            <div key={r.request_id} className="card req-card">
              <div className="req-meta">
                <div>
                  <div className="req-username">{r.username}</div>
                  <div className="req-stars">{stars(r.rating_avg)}</div>
                </div>
                <span className="req-date">{timeAgo(r.created_at)}</span>
              </div>
              <p className="req-description">{r.description}</p>
              {r.user_id === USER_ID() && (
                <button className="delete-btn" title="Delete" onClick={() => handleDelete(r.request_id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}