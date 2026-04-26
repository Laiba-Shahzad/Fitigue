const { sql, poolPromise } = require('../config/db');

// ─── 1. BUY ITEM ────────────────────────────────────────────────
exports.buyItem = async (req, res) => {
  try {
    const { item_id, seller_id } = req.body;
    const buyer_id = req.user.user_id;
    const pool = await poolPromise;

    // Insert trade record
    const tradeResult = await pool.request()
      .input('buyer_id',   sql.Int, buyer_id)
      .input('seller_id',  sql.Int, seller_id)
      .input('item_id',    sql.Int, item_id)
      .query(`
        INSERT INTO Trades (buyer_id, seller_id, item_id, trade_type, status)
        OUTPUT INSERTED.trade_id
        VALUES (@buyer_id, @seller_id, @item_id, 'buy', 'completed')
      `);

    const trade_id = tradeResult.recordset[0].trade_id;

    // Mark item as sold
    await pool.request()
      .input('item_id', sql.Int, item_id)
      .query(`UPDATE WardrobeItems SET status = 'sold' WHERE item_id = @item_id`);

    // Increment total_trades for both buyer and seller
    await pool.request()
      .input('seller_id', sql.Int, seller_id)
      .input('buyer_id',  sql.Int, buyer_id)
      .query(`
        UPDATE Users SET total_trades = total_trades + 1 WHERE user_id = @seller_id;
        UPDATE Users SET total_trades = total_trades + 1 WHERE user_id = @buyer_id;
      `);

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

// ─── 2. GET ALL PURCHASES BY LOGGED-IN USER (BOUGHT) ───────────
exports.getMyPurchases = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('buyer_id', sql.Int, req.user.user_id)
      .query(`
        SELECT t.trade_id, wi.title, wi.category, wi.price, wi.color,
               u_seller.username AS seller, t.trade_date, t.status
        FROM Trades t
        JOIN WardrobeItems wi       ON t.item_id    = wi.item_id
        JOIN Users u_seller         ON t.seller_id  = u_seller.user_id
        WHERE t.buyer_id = @buyer_id AND t.trade_type = 'buy'
        ORDER BY t.trade_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. GET ALL ITEMS SOLD BY LOGGED-IN USER ───────────────────
exports.getMySales = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('seller_id', sql.Int, req.user.user_id)
      .query(`
        SELECT t.trade_id, wi.title, wi.price,
               u_buyer.username AS buyer, t.trade_date, t.status
        FROM Trades t
        JOIN WardrobeItems wi     ON t.item_id   = wi.item_id
        JOIN Users u_buyer        ON t.buyer_id  = u_buyer.user_id
        WHERE t.seller_id = @seller_id AND t.trade_type = 'buy'
        ORDER BY t.trade_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};