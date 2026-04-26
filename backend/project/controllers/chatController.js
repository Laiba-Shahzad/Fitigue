const { sql, poolPromise } = require('../config/db');

// ─── 1. START OR GET CONVERSATION ───────────────────────────────
exports.startConversation = async (req, res) => {
  try {
    const { other_user_id } = req.body;
    const my_id = req.user.user_id;
    const pool = await poolPromise;

    // Check if conversation already exists
    const existing = await pool.request()
      .input('user1_id', sql.Int, my_id)
      .input('user2_id', sql.Int, other_user_id)
      .query(`
        SELECT conversation_id
        FROM Conversations
        WHERE (user1_id = @user1_id AND user2_id = @user2_id)
           OR (user1_id = @user2_id AND user2_id = @user1_id)
      `);

    if (existing.recordset[0]) {
      return res.json({ conversation_id: existing.recordset[0].conversation_id, existing: true });
    }

    // Create new conversation
    const result = await pool.request()
      .input('user1_id', sql.Int, my_id)
      .input('user2_id', sql.Int, other_user_id)
      .query(`
        INSERT INTO Conversations (user1_id, user2_id)
        OUTPUT INSERTED.conversation_id
        VALUES (@user1_id, @user2_id)
      `);

    res.status(201).json({ conversation_id: result.recordset[0].conversation_id, existing: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. SEND MESSAGE ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { message_text } = req.body;
    const conversation_id  = req.params.id;
    const sender_id        = req.user.user_id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('conversation_id', sql.Int,     conversation_id)
      .input('sender_id',       sql.Int,     sender_id)
      .input('message_text',    sql.NVarChar, message_text)
      .query(`
        INSERT INTO Messages (conversation_id, sender_id, message_text)
        OUTPUT INSERTED.message_id, INSERTED.sent_at
        VALUES (@conversation_id, @sender_id, @message_text)
      `);

    res.status(201).json({ message: 'Message sent', ...result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. GET CHATBOX SCREEN (ALL CONVERSATIONS) ───────────────────
exports.getChatbox = async (req, res) => {
  try {
    const my_id = req.user.user_id;
    const pool  = await poolPromise;

    const result = await pool.request()
      .input('my_id', sql.Int, my_id)
      .query(`
        SELECT c.conversation_id,
               CASE WHEN c.user1_id = @my_id THEN u2.username      ELSE u1.username      END AS other_user,
               CASE WHEN c.user1_id = @my_id THEN u2.profile_image ELSE u1.profile_image END AS other_user_img,
               (SELECT TOP 1 message_text FROM Messages
                WHERE conversation_id = c.conversation_id
                ORDER BY sent_at DESC) AS last_message,
               (SELECT TOP 1 sent_at FROM Messages
                WHERE conversation_id = c.conversation_id
                ORDER BY sent_at DESC) AS last_message_time
        FROM Conversations c
        JOIN Users u1 ON c.user1_id = u1.user_id
        JOIN Users u2 ON c.user2_id = u2.user_id
        WHERE c.user1_id = @my_id OR c.user2_id = @my_id
        ORDER BY last_message_time DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. GET CHAT HISTORY ─────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('conversation_id', sql.Int, req.params.id)
      .query(`
        SELECT m.message_id, m.sender_id, u.username AS sender_name,
               m.message_text, m.sent_at
        FROM Messages m
        JOIN Users u ON m.sender_id = u.user_id
        WHERE m.conversation_id = @conversation_id
        ORDER BY m.sent_at ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. DELETE MESSAGE ───────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('message_id', sql.Int, req.params.messageId)
      .input('sender_id',  sql.Int, req.user.user_id)
      .query(`
        DELETE FROM Messages
        WHERE message_id = @message_id AND sender_id = @sender_id
      `);

    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. DELETE CONVERSATION ──────────────────────────────────────
exports.deleteConversation = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('conversation_id', sql.Int, req.params.id)
      .input('my_id',           sql.Int, req.user.user_id)
      .query(`
        DELETE FROM Conversations
        WHERE conversation_id = @conversation_id
          AND (user1_id = @my_id OR user2_id = @my_id)
      `);

    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 7. GET UNREAD MESSAGE COUNT ─────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const my_id = req.user.user_id;
    const pool  = await poolPromise;

    const result = await pool.request()
      .input('my_id', sql.Int, my_id)
      .query(`
        SELECT COUNT(*) AS unread_count
        FROM Messages m
        JOIN Conversations c ON m.conversation_id = c.conversation_id
        WHERE (c.user1_id = @my_id OR c.user2_id = @my_id)
          AND m.sender_id <> @my_id
          AND m.sent_at > (
              SELECT ISNULL(MAX(sent_at), '2000-01-01')
              FROM Messages
              WHERE conversation_id = m.conversation_id
                AND sender_id = @my_id
          )
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};