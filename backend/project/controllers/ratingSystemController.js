const { sql, poolPromise } = require('../config/db');

// ─── 1. SUBMIT RATING AFTER TRADE ───────────────────────────────
exports.submitRating = async (req, res) => {
  try {
    const { reviewed_user_id, trade_id, rating_value } = req.body;
    const reviewer_id = req.user.user_id;
    const pool = await poolPromise;

    // Insert the rating (composite key: trade_id + reviewer_id)
    await pool.request()
      .input('reviewer_id',      sql.Int, reviewer_id)
      .input('reviewed_user_id', sql.Int, reviewed_user_id)
      .input('trade_id',         sql.Int, trade_id)
      .input('rating_value',     sql.Int, rating_value)
      .query(`
        INSERT INTO Ratings (trade_id, reviewer_id, reviewed_user_id, rating_value)
        VALUES (@trade_id, @reviewer_id, @reviewed_user_id, @rating_value)
      `);

    // No longer update Users.rating_avg – it's computed on the fly

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. DELETE RATING ────────────────────────────────────────────
exports.deleteRating = async (req, res) => {
  try {
    const pool = await poolPromise;
    const reviewer_id = req.user.user_id;
    const trade_id = req.params.tradeId;   // route parameter for the trade

    await pool.request()
      .input('trade_id',    sql.Int, trade_id)
      .input('reviewer_id', sql.Int, reviewer_id)
      .query(`
        DELETE FROM Ratings
        WHERE trade_id = @trade_id AND reviewer_id = @reviewer_id
      `);

    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};