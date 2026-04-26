const { sql, poolPromise } = require('../config/db');

// ─── 1. SUBMIT RATING AFTER TRADE ───────────────────────────────
exports.submitRating = async (req, res) => {
  try {
    const { reviewed_user_id, trade_id, rating_value } = req.body;
    const pool = await poolPromise;

    // Insert the rating
    await pool.request()
      .input('reviewer_id',      sql.Int, req.user.user_id)
      .input('reviewed_user_id', sql.Int, reviewed_user_id)
      .input('trade_id',         sql.Int, trade_id)
      .input('rating_value',     sql.Int, rating_value)
      .query(`INSERT INTO Ratings (reviewer_id, reviewed_user_id, trade_id, rating_value)
              VALUES (@reviewer_id, @reviewed_user_id, @trade_id, @rating_value)`);

    // Update the reviewed user's average rating
    await pool.request()
      .input('reviewed_user_id', sql.Int, reviewed_user_id)
      .query(`
        UPDATE Users
        SET rating_avg = (
            SELECT AVG(CAST(rating_value AS DECIMAL(3,1)))
            FROM Ratings
            WHERE reviewed_user_id = @reviewed_user_id
        )
        WHERE user_id = @reviewed_user_id
      `);

    res.status(201).json({ message: 'Rating submitted and average rating updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. DELETE RATING ────────────────────────────────────────────
exports.deleteRating = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('rating_id',   sql.Int, req.params.id)
      .input('reviewer_id', sql.Int, req.user.user_id)
      .query(`DELETE FROM Ratings
              WHERE rating_id = @rating_id AND reviewer_id = @reviewer_id`);

    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};