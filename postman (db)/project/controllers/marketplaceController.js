const { sql, poolPromise } = require('../config/db');

// ─── 1. POST ITEM TO MARKETPLACE ───────────────────────────────
exports.postListing = async (req, res) => {
  try {
    const { item_id } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('item_id',   sql.Int, item_id)
      .input('posted_by', sql.Int, req.user.user_id)
      .query(`INSERT INTO MarketplaceListings (item_id, posted_by) VALUES (@item_id, @posted_by)`);

    res.status(201).json({ message: 'Item posted to marketplace' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. SCROLL ALL LISTINGS ─────────────────────────────────────
exports.getAllListings = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT ml.listing_id, wi.item_id, wi.title, wi.description,
             wi.category, wi.size, wi.color, wi.price,
             wi.allow_sale, wi.allow_swap,
             u.username, u.rating_avg, ml.posted_at
      FROM MarketplaceListings ml
      JOIN WardrobeItems wi ON ml.item_id = wi.item_id
      JOIN Users u ON ml.posted_by = u.user_id
      WHERE wi.status = 'available'
      ORDER BY ml.posted_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. VIEW LISTINGS BY SPECIFIC USER ─────────────────────────
exports.getUserListings = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('posted_by', sql.Int, req.params.userId)
      .query(`
        SELECT ml.listing_id, wi.title, wi.category, wi.price,
               wi.allow_sale, wi.allow_swap, wi.status, ml.posted_at
        FROM MarketplaceListings ml
        JOIN WardrobeItems wi ON ml.item_id = wi.item_id
        WHERE ml.posted_by = @posted_by
        ORDER BY ml.posted_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. REMOVE LISTING ──────────────────────────────────────────
exports.removeListing = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('listing_id', sql.Int, req.params.id)
      .input('posted_by',  sql.Int, req.user.user_id)
      .query(`DELETE FROM MarketplaceListings WHERE listing_id = @listing_id AND posted_by = @posted_by`);

    res.json({ message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. FULL ITEM DETAIL (ON-CLICK) ────────────────────────────
exports.getListingDetail = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('listing_id', sql.Int, req.params.id)
      .query(`
        SELECT wi.item_id, wi.title, wi.description, wi.category,
               wi.size, wi.color, wi.price, wi.allow_sale, wi.allow_swap,
               u.user_id, u.username, u.profile_image, u.rating_avg, u.total_trades,
               ml.posted_at
        FROM MarketplaceListings ml
        JOIN WardrobeItems wi ON ml.item_id = wi.item_id
        JOIN Users u ON ml.posted_by = u.user_id
        WHERE ml.listing_id = @listing_id
      `);

    if (!result.recordset[0]) return res.status(404).json({ message: 'Listing not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. FILTER LISTINGS ─────────────────────────────────────────
exports.filterListings = async (req, res) => {
  try {
    const { category, size, color, min_price, max_price, allow_swap, allow_sale } = req.query;
    const pool = await poolPromise;

    const request = pool.request();
    let query = `
      SELECT ml.listing_id, wi.item_id, wi.title, wi.category,
             wi.size, wi.color, wi.price, wi.allow_sale, wi.allow_swap,
             u.username, u.rating_avg, ml.posted_at
      FROM MarketplaceListings ml
      JOIN WardrobeItems wi ON ml.item_id = wi.item_id
      JOIN Users u ON ml.posted_by = u.user_id
      WHERE wi.status = 'available'
    `;

    if (category) {
      query += ` AND wi.category = @category`;
      request.input('category', sql.VarChar, category);
    }
    if (size) {
      query += ` AND wi.size = @size`;
      request.input('size', sql.VarChar, size);
    }
    if (color) {
      query += ` AND wi.color = @color`;
      request.input('color', sql.VarChar, color);
    }
    if (min_price) {
      query += ` AND wi.price >= @min_price`;
      request.input('min_price', sql.Decimal(10,2), min_price);
    }
    if (max_price) {
      query += ` AND wi.price <= @max_price`;
      request.input('max_price', sql.Decimal(10,2), max_price);
    }
    if (allow_swap === '1') {
      query += ` AND wi.allow_swap = 1`;
    }
    if (allow_sale === '1') {
      query += ` AND wi.allow_sale = 1`;
    }

    query += ` ORDER BY ml.posted_at DESC`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};