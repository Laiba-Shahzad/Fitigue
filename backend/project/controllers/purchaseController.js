const { sql, poolPromise } = require('../config/db');

// ─── 1. BUY ITEM ────────────────────────────────────────────────
exports.buyItem = async (req, res) => {
  try {
    const { item_id } = req.body;
    const buyer_id = req.user.user_id;
    const pool = await poolPromise;

    // Fetch the item and verify it's available, also get the seller (owner)
    const itemResult = await pool.request()
      .input('item_id', sql.Int, item_id)
      .query(`
        SELECT user_id, status
        FROM WardrobeItems
        WHERE item_id = @item_id
      `);

    const item = itemResult.recordset[0];
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.status !== 'available') return res.status(400).json({ message: 'Item is no longer available' });
    if (item.user_id === buyer_id) return res.status(400).json({ message: 'Cannot buy your own item' });

    const seller_id = item.user_id;

    // Insert trade record (seller_id is not stored)
    const tradeResult = await pool.request()
      .input('buyer_id', sql.Int, buyer_id)
      .input('item_id',  sql.Int, item_id)
      .query(`
        INSERT INTO Trades (buyer_id, item_id, trade_type, status)
        OUTPUT INSERTED.trade_id
        VALUES (@buyer_id, @item_id, 'buy', 'completed')
      `);

    const trade_id = tradeResult.recordset[0].trade_id;

    // Mark item as sold
    await pool.request()
      .input('item_id', sql.Int, item_id)
      .query(`UPDATE WardrobeItems SET status = 'sold' WHERE item_id = @item_id`);

    // Notify seller and buyer
    await pool.request()
      .input('seller_id', sql.Int, seller_id)
      .input('buyer_id',  sql.Int, buyer_id)
      .input('trade_id',  sql.Int, trade_id)
      .query(`
        INSERT INTO Notifications (user_id, type, reference_id)
        VALUES (@seller_id, 'item_sold', @trade_id);
        INSERT INTO Notifications (user_id, type, reference_id)
        VALUES (@buyer_id, 'purchase_confirmed', @trade_id);
      `);

    res.status(201).json({ message: 'Purchase successful', trade_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. GET ALL PURCHASES BY LOGGED‑IN USER (BOUGHT) ───────────
exports.getMyPurchases = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('buyer_id', sql.Int, req.user.user_id)
      .query(`
        SELECT t.trade_id, wi.title, wi.category, wi.price, wi.color,
               u_seller.username AS seller, t.trade_date, t.status
        FROM Trades t
        JOIN WardrobeItems wi       ON t.item_id   = wi.item_id
        JOIN Users u_seller         ON wi.user_id  = u_seller.user_id   -- seller = owner of the item
        WHERE t.buyer_id = @buyer_id AND t.trade_type = 'buy'
        ORDER BY t.trade_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. GET ALL ITEMS SOLD BY LOGGED‑IN USER ───────────────────
exports.getMySales = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT t.trade_id, wi.title, wi.price,
               u_buyer.username AS buyer, t.trade_date, t.status
        FROM Trades t
        JOIN WardrobeItems wi     ON t.item_id   = wi.item_id
        JOIN Users u_buyer        ON t.buyer_id  = u_buyer.user_id
        WHERE wi.user_id = @user_id           -- user is the owner of the sold item
          AND t.trade_type = 'buy'
        ORDER BY t.trade_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};