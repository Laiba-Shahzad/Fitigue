import { useState, useEffect } from 'react';
import {
  sendSwapRequest, getIncomingRequests, getOutgoingRequests,
  acceptSwap, rejectSwap, completeSwap, cancelSwap,
} from '../services/api';

export default function SwapsPage() {
  const [tab, setTab]           = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  // Send swap form state
  const [swapForm, setSwapForm] = useState({
    owner_id: '', requested_item_id: '', offered_item_id: ''
  });

  useEffect(() => {
    fetchIncoming();
    fetchOutgoing();
  }, []);

  const fetchIncoming = async () => {
    try { const r = await getIncomingRequests(); setIncoming(r.data); }
    catch (err) { console.error(err); }
  };

  const fetchOutgoing = async () => {
    try { const r = await getOutgoingRequests(); setOutgoing(r.data); }
    catch (err) { console.error(err); }
  };

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else         { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // ── Send swap request ──────────────────────────────────────────
  const handleSendSwap = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendSwapRequest({
        owner_id:          parseInt(swapForm.owner_id),
        requested_item_id: parseInt(swapForm.requested_item_id),
        offered_item_id:   parseInt(swapForm.offered_item_id),
      });
      notify(`Swap request sent! ID: ${res.data.swap_id}`);
      setSwapForm({ owner_id: '', requested_item_id: '', offered_item_id: '' });
      fetchOutgoing();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to send swap request', true);
    } finally { setLoading(false); }
  };

  // ── Accept ─────────────────────────────────────────────────────
  const handleAccept = async (id) => {
    try { await acceptSwap(id); notify('Swap accepted!'); fetchIncoming(); }
    catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  // ── Reject ─────────────────────────────────────────────────────
  const handleReject = async (id) => {
    try { await rejectSwap(id); notify('Swap rejected.'); fetchIncoming(); }
    catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  // ── Complete ───────────────────────────────────────────────────
  const handleComplete = async (id) => {
    try { await completeSwap(id); notify('Swap completed!'); fetchIncoming(); fetchOutgoing(); }
    catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  // ── Cancel ─────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    try { await cancelSwap(id); notify('Swap request cancelled.'); fetchOutgoing(); }
    catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🔄 Swap Requests</h1>

      {error   && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {['incoming', 'outgoing', 'send'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t === 'incoming' ? `📥 Incoming (${incoming.length})` : t === 'outgoing' ? '📤 Outgoing' : '➕ Send Request'}
          </button>
        ))}
      </div>

      {/* ── SEND SWAP FORM ──────────────────────────────────── */}
      {tab === 'send' && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Send a Swap Request</h2>
          <form onSubmit={handleSendSwap} style={styles.form}>
            <label style={styles.label}>Owner ID (who has the item)</label>
            <input style={styles.input} type="number" placeholder="e.g. 2"
              value={swapForm.owner_id}
              onChange={(e) => setSwapForm({ ...swapForm, owner_id: e.target.value })} required />

            <label style={styles.label}>Item I Want (requested_item_id)</label>
            <input style={styles.input} type="number" placeholder="e.g. 6"
              value={swapForm.requested_item_id}
              onChange={(e) => setSwapForm({ ...swapForm, requested_item_id: e.target.value })} required />

            <label style={styles.label}>Item I'm Offering (offered_item_id)</label>
            <input style={styles.input} type="number" placeholder="e.g. 4"
              value={swapForm.offered_item_id}
              onChange={(e) => setSwapForm({ ...swapForm, offered_item_id: e.target.value })} required />

            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Swap Request'}
            </button>
          </form>
        </div>
      )}

      {/* ── INCOMING REQUESTS ───────────────────────────────── */}
      {tab === 'incoming' && (
        <div>
          {incoming.length === 0
            ? <p style={styles.empty}>No pending incoming swap requests.</p>
            : incoming.map((s) => (
              <div key={s.swap_id} style={styles.card}>
                <div style={styles.userRow}>
                  {s.profile_image
                    ? <img src={s.profile_image} alt="" style={styles.avatar} />
                    : <div style={styles.avatarFallback}>{s.requester?.[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <p style={styles.username}>{s.requester}</p>
                    <p style={styles.meta}>⭐ {s.rating_avg ?? 'N/A'} rating</p>
                  </div>
                  <span style={styles.dateRight}>{formatDate(s.created_at)}</span>
                </div>

                <div style={styles.swapRow}>
                  <div style={styles.swapBox}>
                    <p style={styles.swapLabel}>They want</p>
                    <p style={styles.swapItem}>{s.requested_item}</p>
                  </div>
                  <div style={styles.arrow}>⇄</div>
                  <div style={styles.swapBox}>
                    <p style={styles.swapLabel}>They offer</p>
                    <p style={styles.swapItem}>{s.offered_item}</p>
                    <p style={styles.meta}>{s.size} · {s.color}</p>
                  </div>
                </div>

                <div style={styles.btnRow}>
                  <button style={styles.btnGreen}  onClick={() => handleAccept(s.swap_id)}>✓ Accept</button>
                  <button style={styles.btnRed}    onClick={() => handleReject(s.swap_id)}>✗ Reject</button>
                  <button style={styles.btnPurple} onClick={() => handleComplete(s.swap_id)}>✔ Complete</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── OUTGOING REQUESTS ───────────────────────────────── */}
      {tab === 'outgoing' && (
        <div>
          {outgoing.length === 0
            ? <p style={styles.empty}>No outgoing swap requests.</p>
            : outgoing.map((s) => (
              <div key={s.swap_id} style={styles.card}>
                <div style={styles.rowBetween}>
                  <span style={styles.username}>To: {s.owner}</span>
                  <span style={styles.statusPill(s.status)}>{s.status}</span>
                </div>
                <div style={styles.swapRow}>
                  <div style={styles.swapBox}>
                    <p style={styles.swapLabel}>I want</p>
                    <p style={styles.swapItem}>{s.i_want}</p>
                  </div>
                  <div style={styles.arrow}>⇄</div>
                  <div style={styles.swapBox}>
                    <p style={styles.swapLabel}>I offered</p>
                    <p style={styles.swapItem}>{s.i_offered}</p>
                  </div>
                </div>
                <p style={styles.meta}>{formatDate(s.created_at)}</p>
                {s.status === 'pending' && (
                  <button style={styles.btnRed} onClick={() => handleCancel(s.swap_id)}>
                    Cancel Request
                  </button>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

const styles = {
  page:        { maxWidth: 720, margin: '0 auto', padding: '32px 16px', fontFamily: "'Segoe UI', sans-serif" },
  heading:     { fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' },
  tabBar:      { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  tab:         { padding: '10px 18px', border: '2px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600, color: '#555' },
  tabActive:   { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  card:        { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle:   { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' },
  form:        { display: 'flex', flexDirection: 'column', gap: 12 },
  label:       { fontWeight: 600, fontSize: 13, color: '#444' },
  input:       { padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14 },
  btn:         { padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnGreen:    { padding: '8px 14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  btnRed:      { padding: '8px 14px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  btnPurple:   { padding: '8px 14px', background: '#8e44ad', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  btnRow:      { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  error:       { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 },
  success:     { background: '#f0fff4', color: '#27ae60', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 },
  userRow:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:      { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 44, height: 44, borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
  username:    { fontWeight: 700, fontSize: 15, color: '#1a1a2e', margin: 0 },
  meta:        { fontSize: 12, color: '#888', margin: '2px 0' },
  dateRight:   { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  swapRow:     { display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' },
  swapBox:     { flex: 1, background: '#f7f7f7', borderRadius: 8, padding: '10px 14px' },
  swapLabel:   { fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' },
  swapItem:    { fontWeight: 700, fontSize: 14, color: '#222', margin: 0 },
  arrow:       { fontSize: 22, color: '#888' },
  rowBetween:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill:  (s) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s === 'accepted' ? '#e8f5e9' : s === 'rejected' ? '#fff0f0' : s === 'completed' ? '#e3f2fd' : '#fff8e1', color: s === 'accepted' ? '#2e7d32' : s === 'rejected' ? '#c0392b' : s === 'completed' ? '#1565c0' : '#f57f17' }),
  empty:       { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 15 },
};