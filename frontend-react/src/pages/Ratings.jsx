import { useState } from 'react';
import { submitRating } from '../api';

export default function Ratings() {
  const [reviewedUser, setReviewedUser] = useState('');
  const [tradeId, setTradeId]           = useState('');
  const [stars, setStars]               = useState(0);
  const [hover, setHover]               = useState(0);
  const [msg, setMsg]                   = useState(null);
  const [loading, setLoading]           = useState(false);

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };

  const handleSubmit = async () => {
    if (!reviewedUser || !tradeId) return flash('Enter both User ID and Trade ID.', 'error');
    if (!stars)                    return flash('Please select a star rating.', 'error');
    setLoading(true);
    try {
      await submitRating(Number(reviewedUser), Number(tradeId), stars);
      flash('Rating submitted successfully!', 'success');
      setReviewedUser(''); setTradeId(''); setStars(0);
    } catch (e) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const displayed = hover || stars;

  return (
    <div className="page">
      <div className="panel-header">
        <h2>Submit a Rating</h2>
      </div>

      <div className="card form-card">
        <label className="form-label">User ID to Rate</label>
        <input
          className="form-input" type="number" placeholder="e.g. 4"
          value={reviewedUser} onChange={e => setReviewedUser(e.target.value)}
        />

        <label className="form-label">Trade ID</label>
        <input
          className="form-input" type="number" placeholder="e.g. 12"
          value={tradeId} onChange={e => setTradeId(e.target.value)}
        />

        <label className="form-label">Rating (1 – 5)</label>
        <div
          className="star-picker"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              className={`star ${v <= displayed ? 'lit' : ''}`}
              onMouseEnter={() => setHover(v)}
              onClick={() => setStars(v)}
            >★</button>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>

        {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
      </div>
    </div>
  );
}