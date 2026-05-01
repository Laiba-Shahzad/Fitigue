const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//  1. REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password, gender, age } = req.body;
    const pool = await poolPromise;

    // Check if username exists
    const check = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`SELECT COUNT(*) AS exists_flag FROM Users WHERE username = @username`);

    if (check.recordset[0].exists_flag > 0)
      return res.status(409).json({ message: 'Username already taken' });

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await pool.request()
      .input('username',      sql.VarChar,  username)
      .input('email',         sql.VarChar,  email)
      .input('password_hash', sql.VarChar,  password_hash)
      .input('gender',        sql.Char(1),  gender || null)
      .input('age',           sql.Int,      age || null)
      .query(`
        INSERT INTO Users (username, email, password_hash, gender, age)
        VALUES (@username, @email, @password_hash, @gender, @age)
      `);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. LOGIN ──────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT 
          u.user_id, 
          u.username, 
          u.email, 
          u.password_hash,
          -- computed rating average
          (SELECT AVG(CAST(r.rating_value AS DECIMAL(3,1))) 
           FROM Ratings r 
           WHERE r.reviewed_user_id = u.user_id) AS rating_avg,
          -- computed total trades (as buyer + seller through owned items)
          (SELECT COUNT(*) FROM Trades WHERE buyer_id = u.user_id)
          + (SELECT COUNT(*) 
             FROM Trades t 
             INNER JOIN WardrobeItems wi ON t.item_id = wi.item_id 
             WHERE wi.user_id = u.user_id) AS total_trades
        FROM Users u
        WHERE u.username = @username
      `);

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from output
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. VIEW OWN PROFILE ────────────────────────────
exports.getOwnProfile = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT 
          u.user_id, 
          u.username, 
          u.gender, 
          u.age,
          u.created_at,

          -- computed rating average
          (SELECT AVG(CAST(r.rating_value AS DECIMAL(3,1))) 
           FROM Ratings r 
           WHERE r.reviewed_user_id = u.user_id) AS rating_avg,

          -- computed total trades
          (SELECT COUNT(*) FROM Trades WHERE buyer_id = u.user_id)
          + (SELECT COUNT(*) 
             FROM Trades t 
             INNER JOIN WardrobeItems wi ON t.item_id = wi.item_id 
             WHERE wi.user_id = u.user_id) AS total_trades,

          -- wardrobe count
          (SELECT COUNT(*) 
           FROM WardrobeItems 
           WHERE user_id = u.user_id) AS wardrobe_count,

          -- total posts (via MarketplaceListings joined to their items)
          (SELECT COUNT(*) 
           FROM MarketplaceListings ml 
           INNER JOIN WardrobeItems wi ON ml.item_id = wi.item_id 
           WHERE wi.user_id = u.user_id) AS total_posts
        FROM Users u
        WHERE u.user_id = @user_id
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. VIEW ANOTHER USER'S PROFILE ─────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.id)
      .query(`
        SELECT 
          u.username, 

          -- computed rating average
          (SELECT AVG(CAST(r.rating_value AS DECIMAL(3,1))) 
           FROM Ratings r 
           WHERE r.reviewed_user_id = u.user_id) AS rating_avg,

          -- computed total trades
          (SELECT COUNT(*) FROM Trades WHERE buyer_id = u.user_id)
          + (SELECT COUNT(*) 
             FROM Trades t 
             INNER JOIN WardrobeItems wi ON t.item_id = wi.item_id 
             WHERE wi.user_id = u.user_id) AS total_trades,

          -- active items
          (SELECT COUNT(*) 
           FROM WardrobeItems 
           WHERE user_id = u.user_id AND status = 'available') AS active_items,

          -- total posts (via marketplace)
          (SELECT COUNT(*) 
           FROM MarketplaceListings ml 
           INNER JOIN WardrobeItems wi ON ml.item_id = wi.item_id 
           WHERE wi.user_id = u.user_id) AS total_posts
        FROM Users u
        WHERE u.user_id = @user_id
      `);

    if (!result.recordset[0]) return res.status(404).json({ message: 'User not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. EDIT PROFILE ────────────────────────────────────────────
exports.editProfile = async (req, res) => {
  try {
    const { username, age } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('username',      sql.VarChar, username)
      .input('age',           sql.Int,     age)
      .input('user_id',       sql.Int,     req.user.user_id)
      .query(`
        UPDATE Users
        SET username = @username, age = @age
        WHERE user_id = @user_id
      `);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. CHANGE PASSWORD ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const pool = await poolPromise;

    // Fetch current hash
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`SELECT password_hash FROM Users WHERE user_id = @user_id`);

    const match = await bcrypt.compare(old_password, result.recordset[0].password_hash);
    if (!match) return res.status(401).json({ message: 'Old password incorrect' });

    const new_hash = await bcrypt.hash(new_password, 10);

    await pool.request()
      .input('hash',    sql.VarChar, new_hash)
      .input('user_id', sql.Int,     req.user.user_id)
      .query(`UPDATE Users SET password_hash = @hash WHERE user_id = @user_id`);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 7. DELETE ACCOUNT ──────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`DELETE FROM Users WHERE user_id = @user_id`);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 8. CHECK USERNAME ──────────────────────────────────────────
exports.checkUsername = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.VarChar, req.params.username)
      .query(`SELECT COUNT(*) AS exists_flag FROM Users WHERE username = @username`);

    res.json({ available: result.recordset[0].exists_flag === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};