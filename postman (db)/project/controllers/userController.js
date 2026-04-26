const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//  1. REGISTER 
exports.register = async (req, res) => {
  try {
    const { username, email, password, profile_image, gender, age } = req.body;
    const pool = await poolPromise;

    // Check if username exists
    const check = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`SELECT COUNT(*) AS exists_flag FROM Users WHERE username = @username`);

    if (check.recordset[0].exists_flag > 0)
      return res.status(409).json({ message: 'Username already taken' });

    const password_hash = password; // store as plain text

    await pool.request()
      .input('username',      sql.VarChar,  username)
      .input('email',         sql.VarChar,  email)
      .input('password_hash', sql.VarChar,  password_hash)
      .input('profile_image', sql.VarChar,  profile_image || null)
      .input('gender',        sql.Char(1),  gender || null)
      .input('age',           sql.Int,      age || null)
      .query(`
        INSERT INTO Users (username, email, password_hash, profile_image, gender, age)
        VALUES (@username, @email, @password_hash, @profile_image, @gender, @age)
      `);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT user_id, username, email, profile_image, rating_avg, total_trades, password_hash
        FROM Users
        WHERE username = @username
      `);

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = password === user.password_hash;
    if (!match) return res.status(401).json({ message: 'Incorrect password' });
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. VIEW OWN PROFILE ────────────────────────────────────────
exports.getOwnProfile = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT u.user_id, u.username, u.profile_image, u.gender, u.age,
               u.rating_avg, u.total_trades, u.created_at,
               (SELECT COUNT(*) FROM WardrobeItems WHERE user_id = u.user_id) AS wardrobe_count,
               (SELECT COUNT(*) FROM MarketplaceListings WHERE posted_by = u.user_id) AS total_posts
        FROM Users u
        WHERE u.user_id = @user_id
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. VIEW ANOTHER USER'S PROFILE ────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.id)
      .query(`
        SELECT u.username, u.profile_image, u.rating_avg, u.total_trades,
               (SELECT COUNT(*) FROM WardrobeItems WHERE user_id = u.user_id AND status = 'available') AS active_items,
               (SELECT COUNT(*) FROM MarketplaceListings WHERE posted_by = u.user_id) AS total_posts
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
    const { username, profile_image, age } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('username',      sql.VarChar, username)
      .input('profile_image', sql.VarChar, profile_image)
      .input('age',           sql.Int,     age)
      .input('user_id',       sql.Int,     req.user.user_id)
      .query(`
        UPDATE Users
        SET username = @username, profile_image = @profile_image, age = @age
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