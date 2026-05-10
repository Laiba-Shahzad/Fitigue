const { sql, poolPromise } = require('../config/db');

const ensureConversation = async (pool, user1Id, user2Id) => {
  const existing = await pool.request()
    .input('user1_id', sql.Int, user1Id)
    .input('user2_id', sql.Int, user2Id)
    .query(`
      SELECT TOP 1 conversation_id
      FROM Conversations
      WHERE (user1_id = @user1_id AND user2_id = @user2_id)
         OR (user1_id = @user2_id AND user2_id = @user1_id)
    `);

  if (existing.recordset[0]) return existing.recordset[0].conversation_id;

  const created = await pool.request()
    .input('user1_id', sql.Int, user1Id)
    .input('user2_id', sql.Int, user2Id)
    .query(`
      INSERT INTO Conversations (user1_id, user2_id)
      OUTPUT INSERTED.conversation_id
      VALUES (@user1_id, @user2_id)
    `);

  return created.recordset[0].conversation_id;
};

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
        SELECT
          n.notification_id,
          n.type,
          n.reference_id,
          n.is_read,
          n.created_at,
          t.item_id AS buy_item_id,
          sr.requested_item_id,
          sr.offered_item_id,
          CASE
            WHEN n.type = 'buy_request' THEN CONCAT(ISNULL(u_buyer.username, 'Someone'), ' wants to buy ', ISNULL(wi_buy.title, 'your item'))
            WHEN n.type = 'buy_request_accepted' THEN CONCAT(ISNULL(u_seller.username, 'Seller'), ' accepted your buy request for ', ISNULL(wi_buy.title, 'an item'))
            WHEN n.type = 'buy_request_rejected' THEN CONCAT(ISNULL(u_seller.username, 'Seller'), ' rejected your buy request for ', ISNULL(wi_buy.title, 'an item'))
            WHEN n.type = 'swap_request' THEN CONCAT(ISNULL(u_requester.username, 'Someone'), ' wants to swap ', ISNULL(wi_off.title, 'their item'), ' for ', ISNULL(wi_req.title, 'your item'))
            WHEN n.type = 'swap_request_accepted' THEN CONCAT(ISNULL(u_owner.username, 'Owner'), ' accepted your swap request')
            WHEN n.type = 'swap_request_rejected' THEN CONCAT(ISNULL(u_owner.username, 'Owner'), ' rejected your swap request')
            ELSE n.type
          END AS message,
          CASE WHEN n.type IN ('buy_request', 'swap_request') THEN 1 ELSE 0 END AS actionable
        FROM Notifications n
        LEFT JOIN Trades t ON n.reference_id = t.trade_id AND n.type IN ('buy_request', 'buy_request_accepted', 'buy_request_rejected')
        LEFT JOIN WardrobeItems wi_buy ON t.item_id = wi_buy.item_id
        LEFT JOIN Users u_buyer ON t.buyer_id = u_buyer.user_id
        LEFT JOIN Users u_seller ON wi_buy.user_id = u_seller.user_id
        LEFT JOIN SwapRequests sr ON n.reference_id = sr.swap_id AND n.type IN ('swap_request', 'swap_request_accepted', 'swap_request_rejected')
        LEFT JOIN WardrobeItems wi_req ON sr.requested_item_id = wi_req.item_id
        LEFT JOIN WardrobeItems wi_off ON sr.offered_item_id = wi_off.item_id
        LEFT JOIN Users u_requester ON wi_off.user_id = u_requester.user_id
        LEFT JOIN Users u_owner ON wi_req.user_id = u_owner.user_id
        WHERE n.user_id = @user_id
        ORDER BY n.created_at DESC
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
      .query(`UPDATE Notifications SET is_read = 1 WHERE notification_id = @notification_id AND user_id = @user_id`);

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. ACCEPT/REJECT ACTIONABLE NOTIFICATIONS ───────────────────
exports.respondToNotification = async (req, res) => {
  try {
    const { decision } = req.body;
    const notificationId = Number(req.params.id);
    const userId = req.user.user_id;
    const pool = await poolPromise;

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be accept or reject' });
    }

    const notifResult = await pool.request()
      .input('notification_id', sql.Int, notificationId)
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT notification_id, type, reference_id
        FROM Notifications
        WHERE notification_id = @notification_id AND user_id = @user_id
      `);

    const notif = notifResult.recordset[0];
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    if (!['buy_request', 'swap_request'].includes(notif.type)) {
      return res.status(400).json({ message: 'Notification is not actionable' });
    }

    if (notif.type === 'buy_request') {
      const tradeResult = await pool.request()
        .input('trade_id', sql.Int, notif.reference_id)
        .query(`
          SELECT t.trade_id, t.buyer_id, t.item_id, t.status, wi.user_id AS seller_id
          FROM Trades t
          JOIN WardrobeItems wi ON t.item_id = wi.item_id
          WHERE t.trade_id = @trade_id
        `);
      const trade = tradeResult.recordset[0];
      if (!trade || trade.status !== 'pending') return res.status(400).json({ message: 'Trade is not pending' });
      if (trade.seller_id !== userId) return res.status(403).json({ message: 'Only seller can respond' });

      if (decision === 'accept') {
        await pool.request()
          .input('trade_id', sql.Int, trade.trade_id)
          .input('item_id', sql.Int, trade.item_id)
          .query(`
            UPDATE Trades SET status = 'completed' WHERE trade_id = @trade_id;
            DELETE FROM MarketplaceListings WHERE item_id = @item_id;
            UPDATE WardrobeItems SET status = 'traded' WHERE item_id = @item_id;
          `);
        const conversation_id = await ensureConversation(pool, trade.seller_id, trade.buyer_id);
        await pool.request()
          .input('buyer_id', sql.Int, trade.buyer_id)
          .input('trade_id', sql.Int, trade.trade_id)
          .query(`INSERT INTO Notifications (user_id, type, reference_id) VALUES (@buyer_id, 'buy_request_accepted', @trade_id)`);
        await pool.request().input('notification_id', sql.Int, notif.notification_id).query(`DELETE FROM Notifications WHERE notification_id = @notification_id`);
        return res.json({ message: 'Buy request accepted', conversation_id });
      }

      await pool.request()
        .input('trade_id', sql.Int, trade.trade_id)
        .query(`UPDATE Trades SET status = 'cancelled' WHERE trade_id = @trade_id`);
      await pool.request()
        .input('buyer_id', sql.Int, trade.buyer_id)
        .input('trade_id', sql.Int, trade.trade_id)
        .query(`INSERT INTO Notifications (user_id, type, reference_id) VALUES (@buyer_id, 'buy_request_rejected', @trade_id)`);
      await pool.request().input('notification_id', sql.Int, notif.notification_id).query(`DELETE FROM Notifications WHERE notification_id = @notification_id`);
      return res.json({ message: 'Buy request rejected' });
    }

    const swapResult = await pool.request()
      .input('swap_id', sql.Int, notif.reference_id)
      .query(`
        SELECT sr.swap_id, sr.status, sr.requested_item_id, sr.offered_item_id,
               req_item.user_id AS owner_id, off_item.user_id AS requester_id,
               req_item.price AS requested_price, off_item.price AS offered_price
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
        WHERE sr.swap_id = @swap_id
      `);
    const swap = swapResult.recordset[0];
    if (!swap || swap.status !== 'pending') return res.status(400).json({ message: 'Swap is not pending' });
    if (swap.owner_id !== userId) return res.status(403).json({ message: 'Only owner can respond' });

    if (decision === 'accept') {
      await pool.request()
        .input('swap_id', sql.Int, swap.swap_id)
        .input('requested_item_id', sql.Int, swap.requested_item_id)
        .input('offered_item_id', sql.Int, swap.offered_item_id)
        .input('owner_id', sql.Int, swap.owner_id)
        .input('requester_id', sql.Int, swap.requester_id)
        .input('requested_price', sql.Decimal(10,2), swap.requested_price)
        .input('offered_price', sql.Decimal(10,2), swap.offered_price)
        .query(`
          UPDATE SwapRequests SET status = 'completed' WHERE swap_id = @swap_id;
          DELETE FROM MarketplaceListings WHERE item_id = @requested_item_id OR item_id = @offered_item_id;
          UPDATE WardrobeItems SET status = 'traded' WHERE item_id = @requested_item_id OR item_id = @offered_item_id;
          INSERT INTO Trades (buyer_id, item_id, trade_type, status) VALUES (@requester_id, @requested_item_id, 'swap', 'completed');
          INSERT INTO Trades (buyer_id, item_id, trade_type, status) VALUES (@owner_id, @offered_item_id, 'swap', 'completed');
        `);
      const conversation_id = await ensureConversation(pool, swap.owner_id, swap.requester_id);
      await pool.request()
        .input('requester_id', sql.Int, swap.requester_id)
        .input('swap_id', sql.Int, swap.swap_id)
        .query(`INSERT INTO Notifications (user_id, type, reference_id) VALUES (@requester_id, 'swap_request_accepted', @swap_id)`);
      await pool.request().input('notification_id', sql.Int, notif.notification_id).query(`DELETE FROM Notifications WHERE notification_id = @notification_id`);
      return res.json({ message: 'Swap request accepted', conversation_id });
    }

    await pool.request().input('swap_id', sql.Int, swap.swap_id).query(`UPDATE SwapRequests SET status = 'cancelled' WHERE swap_id = @swap_id`);
    await pool.request()
      .input('requester_id', sql.Int, swap.requester_id)
      .input('swap_id', sql.Int, swap.swap_id)
      .query(`INSERT INTO Notifications (user_id, type, reference_id) VALUES (@requester_id, 'swap_request_rejected', @swap_id)`);
    await pool.request().input('notification_id', sql.Int, notif.notification_id).query(`DELETE FROM Notifications WHERE notification_id = @notification_id`);
    return res.json({ message: 'Swap request rejected' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── 7. DELETE ALL READ NOTIFICATIONS ───────────────────────────
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