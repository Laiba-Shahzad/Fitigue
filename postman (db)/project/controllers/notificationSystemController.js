const { sql, poolPromise } = require('../config/db');

// ─── 1. CREATE NOTIFICATION ─────────────────────────────────────
exports.createNotification = async (req, res) => {
  try {
    const { user_id, type, reference_id } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id',      sql.Int,         user_id)
      .input('type',         sql.VarChar(50),  type)
      .input('reference_id', sql.Int,          reference_id)
      .query(`INSERT INTO Notifications (user_id, type, reference_id)
              VALUES (@user_id, @type, @reference_id)`);

    res.status(201).json({ message: 'Notification created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. GET ALL NOTIFICATIONS FOR USER ──────────────────────────
exports.getAllNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT notification_id, type, reference_id, is_read, created_at
        FROM Notifications
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. GET UNREAD NOTIFICATIONS ────────────────────────────────
exports.getUnreadNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT notification_id, type, reference_id, created_at
        FROM Notifications
        WHERE user_id = @user_id AND is_read = 0
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. COUNT UNREAD NOTIFICATIONS ──────────────────────────────
exports.countUnreadNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT COUNT(*) AS unread_count
        FROM Notifications
        WHERE user_id = @user_id AND is_read = 0
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. MARK NOTIFICATION AS READ ───────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('notification_id', sql.Int, req.params.id)
      .input('user_id',         sql.Int, req.user.user_id)
      .query(`
        UPDATE Notifications
        SET is_read = 1
        WHERE notification_id = @notification_id AND user_id = @user_id
      `);

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. DELETE ALL READ NOTIFICATIONS ───────────────────────────
exports.deleteReadNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        DELETE FROM Notifications
        WHERE user_id = @user_id AND is_read = 1
      `);

    res.json({ message: 'Read notifications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};