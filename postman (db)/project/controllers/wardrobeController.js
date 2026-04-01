const { sql, poolPromise } = require('../config/db');

// ─── 1. ADD ITEM TO WARDROBE ────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { title, description, category, size, color, price, allow_sale, allow_swap } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id',     sql.Int,          req.user.user_id)
      .input('title',       sql.VarChar,       title)
      .input('description', sql.VarChar,       description)
      .input('category',    sql.VarChar,       category)
      .input('size',        sql.VarChar,       size)
      .input('color',       sql.VarChar,       color)
      .input('price',       sql.Decimal(10,2), price)
      .input('allow_sale',  sql.Bit,           allow_sale)
      .input('allow_swap',  sql.Bit,           allow_swap)
      .query(`
        INSERT INTO WardrobeItems (user_id, title, description, category, size, color, price, allow_sale, allow_swap)
        VALUES (@user_id, @title, @description, @category, @size, @color, @price, @allow_sale, @allow_swap)
      `);

    res.status(201).json({ message: 'Item added to wardrobe' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. VIEW ALL ITEMS IN WARDROBE ─────────────────────────────
exports.getMyWardrobe = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, req.user.user_id)
      .query(`
        SELECT item_id, title, category, size, color, price,
               allow_sale, allow_swap, status, created_at
        FROM WardrobeItems
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. VIEW SINGLE WARDROBE ITEM ──────────────────────────────
exports.getItem = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('item_id', sql.Int, req.params.id)
      .query(`
        SELECT wi.*, u.username, u.rating_avg
        FROM WardrobeItems wi
        JOIN Users u ON wi.user_id = u.user_id
        WHERE wi.item_id = @item_id
      `);

    if (!result.recordset[0]) return res.status(404).json({ message: 'Item not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. EDIT ITEM ───────────────────────────────────────────────
exports.editItem = async (req, res) => {
  try {
    const { title, description, price, color, allow_swap, allow_sale } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('title',       sql.VarChar,       title)
      .input('description', sql.VarChar,       description)
      .input('price',       sql.Decimal(10,2), price)
      .input('color',       sql.VarChar,       color)
      .input('allow_swap',  sql.Bit,           allow_swap)
      .input('allow_sale',  sql.Bit,           allow_sale)
      .input('item_id',     sql.Int,           req.params.id)
      .input('user_id',     sql.Int,           req.user.user_id)
      .query(`
        UPDATE WardrobeItems
        SET title = @title, description = @description,
            price = @price, color = @color,
            allow_swap = @allow_swap, allow_sale = @allow_sale
        WHERE item_id = @item_id AND user_id = @user_id
      `);

    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. MARK ITEM AS SOLD / AVAILABLE ──────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'sold' or 'available'
    const pool = await poolPromise;

    await pool.request()
      .input('status',  sql.VarChar, status)
      .input('item_id', sql.Int,     req.params.id)
      .input('user_id', sql.Int,     req.user.user_id)
      .query(`
        UPDATE WardrobeItems
        SET status = @status
        WHERE item_id = @item_id AND user_id = @user_id
      `);

    res.json({ message: `Item marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. DELETE ITEM ─────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('item_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.user_id)
      .query(`DELETE FROM WardrobeItems WHERE item_id = @item_id AND user_id = @user_id`);

    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 7. VIEW WARDROBE BY CATEGORY ──────────────────────────────
exports.getByCategory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id',  sql.Int,     req.user.user_id)
      .input('category', sql.VarChar, req.params.category)
      .query(`
        SELECT item_id, title, size, color, price, status
        FROM WardrobeItems
        WHERE user_id = @user_id AND category = @category
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};