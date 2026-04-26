const { sql, poolPromise } = require('../config/db');

// ─── 1. POST CLOTHING REQUEST ────────────────────────────────────
exports.createClothingRequest = async (req, res) => {
  try {
    const { description } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id',     sql.Int,          req.user.user_id)
      .input('description', sql.VarChar(500),  description)
      .query(`INSERT INTO ClothingRequests (user_id, description)
              VALUES (@user_id, @description)`);

    res.status(201).json({ message: 'Clothing request posted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. VIEW ALL CLOTHING REQUESTS ──────────────────────────────
exports.getAllClothingRequests = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT cr.request_id, u.username, u.profile_image, u.rating_avg,
             cr.description, cr.created_at
      FROM ClothingRequests cr
      JOIN Users u ON cr.user_id = u.user_id
      ORDER BY cr.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. REMOVE CLOTHING REQUEST ─────────────────────────────────
exports.deleteClothingRequest = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('request_id', sql.Int, req.params.id)
      .input('user_id',    sql.Int, req.user.user_id)
      .query(`DELETE FROM ClothingRequests
              WHERE request_id = @request_id AND user_id = @user_id`);

    res.json({ message: 'Clothing request removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};