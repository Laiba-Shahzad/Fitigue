const { sql, poolPromise } = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// ─── 1. ADD ITEM TO WARDROBE ────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { title, description, category, size, color, price, allow_sale, allow_swap } = req.body;
    const image_url = req.file ? req.file.path : null; //cloudinary URL
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
      .input('image_url',   sql.VarChar,       image_url)
      .query(`
        INSERT INTO WardrobeItems 
          (user_id, title, description, category, size, color, price, allow_sale, allow_swap, image_url)
        VALUES 
          (@user_id, @title, @description, @category, @size, @color, @price, @allow_sale, @allow_swap, @image_url)
      `);

    res.status(201).json({ message: 'Item added', image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const image_url = req.file.path;
    const pool = await poolPromise;

    await pool.request()
      .input('image_url', sql.VarChar, image_url)
      .input('item_id',   sql.Int,     req.params.id)
      .input('user_id',   sql.Int,     req.user.user_id)
      .query(`
        UPDATE WardrobeItems
        SET image_url = @image_url
        WHERE item_id = @item_id AND user_id = @user_id
      `);

    res.json({ message: 'Image updated', image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItemImage = async (req, res) => {
  try {
    const { cloudinary } = require('../config/cloudinary');
    const pool = await poolPromise;

    // get current image url
    const result = await pool.request()
      .input('item_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.user_id)
      .query(`SELECT image_url FROM WardrobeItems WHERE item_id = @item_id AND user_id = @user_id`);

    const item = result.recordset[0];
    if (!item || !item.image_url) return res.status(404).json({ message: 'No image found' });

    // extract public_id from cloudinary url and delete
    const publicId = item.image_url.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // set image_url to null in db
    await pool.request()
      .input('item_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.user_id)
      .query(`UPDATE WardrobeItems SET image_url = NULL WHERE item_id = @item_id AND user_id = @user_id`);

    res.json({ message: 'Image deleted' });
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

