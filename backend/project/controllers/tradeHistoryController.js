const { sql, poolPromise } = require('../config/db');

// ─── 1. TRADE HISTORY FOR USER ──────────────────────────────────
exports.getTradeHistory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT t.trade_id,
               CASE WHEN t.buyer_id = @user_id THEN 'Bought' ELSE 'Sold' END AS action,
               wi.title, wi.category, wi.price,
               CASE WHEN t.buyer_id = @user_id
                    THEN (SELECT username FROM Users WHERE user_id = t.seller_id)
                    ELSE (SELECT username FROM Users WHERE user_id = t.buyer_id)
               END AS other_party,
               t.trade_type, t.status, t.trade_date
        FROM Trades t
        JOIN WardrobeItems wi ON t.item_id = wi.item_id
        WHERE t.buyer_id = @user_id OR t.seller_id = @user_id
        ORDER BY t.trade_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. SWAP HISTORY FOR USER ───────────────────────────────────
exports.getSwapHistory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT sr.swap_id,
               req_item.title AS item_wanted,
               off_item.title AS item_offered,
               CASE WHEN sr.requester_id = @user_id THEN u_owner.username
                    ELSE u_req.username END AS other_user,
               sr.status, sr.created_at
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
        JOIN Users u_req ON sr.requester_id = u_req.user_id
        JOIN Users u_owner ON sr.owner_id = u_owner.user_id
        WHERE sr.requester_id = @user_id OR sr.owner_id = @user_id
        ORDER BY sr.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. COUNT TRADES BY STATUS ──────────────────────────────────
exports.getTradeStatusCount = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT status, COUNT(*) AS count
        FROM Trades
        WHERE buyer_id = @user_id OR seller_id = @user_id
        GROUP BY status
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. CANCEL A PENDING TRADE ──────────────────────────────────
exports.cancelTrade = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('trade_id', sql.Int, req.params.id)
      .input('user_id',  sql.Int, req.user.user_id)
      .query(`
        UPDATE Trades
        SET status = 'cancelled'
        WHERE trade_id = @trade_id AND status = 'pending'`
    );

    res.json({ message: 'Trade cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};