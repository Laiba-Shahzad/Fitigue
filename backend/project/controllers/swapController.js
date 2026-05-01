const { sql, poolPromise } = require('../config/db');

// ─── 1. SEND SWAP REQUEST ────────────────────────────────────────
exports.sendSwapRequest = async (req, res) => {
  try {
    const { requested_item_id, offered_item_id } = req.body; // no more owner_id
    const requester_id = req.user.user_id;
    const pool = await poolPromise;

    // Verify offered item belongs to logged‑in user
    const offeredItem = await pool.request()
      .input('item_id', sql.Int, offered_item_id)
      .query(`SELECT user_id FROM WardrobeItems WHERE item_id = @item_id`);

    if (!offeredItem.recordset[0] || offeredItem.recordset[0].user_id !== requester_id) {
      return res.status(403).json({ message: 'You can only offer your own items' });
    }

    // Verify requested item belongs to a different user
    const requestedItem = await pool.request()
      .input('item_id', sql.Int, requested_item_id)
      .query(`SELECT user_id FROM WardrobeItems WHERE item_id = @item_id`);

    if (!requestedItem.recordset[0]) return res.status(404).json({ message: 'Requested item not found' });
    const owner_id = requestedItem.recordset[0].user_id;
    if (owner_id === requester_id) return res.status(400).json({ message: 'Cannot swap your own item' });

    // Insert swap request (requester & owner are derived from items)
    const result = await pool.request()
      .input('requested_item_id', sql.Int, requested_item_id)
      .input('offered_item_id',   sql.Int, offered_item_id)
      .query(`
        INSERT INTO SwapRequests (requested_item_id, offered_item_id, status)
        OUTPUT INSERTED.swap_id
        VALUES (@requested_item_id, @offered_item_id, 'pending')
      `);

    const swap_id = result.recordset[0].swap_id;

    // Notify the owner of the requested item
    await pool.request()
      .input('owner_id', sql.Int, owner_id)
      .input('swap_id',  sql.Int, swap_id)
      .query(`
        INSERT INTO Notifications (user_id, type, reference_id)
        VALUES (@owner_id, 'swap_request', @swap_id)
      `);

    res.status(201).json({ message: 'Swap request sent', swap_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. VIEW INCOMING SWAP REQUESTS ─────────────────────────────
exports.getIncomingRequests = async (req, res) => {
  try {
    const pool = await poolPromise;
    const user_id = req.user.user_id;

    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT sr.swap_id,
               u_req.username AS requester,
               (SELECT AVG(CAST(r.rating_value AS DECIMAL(3,1)))
                FROM Ratings r
                WHERE r.reviewed_user_id = u_req.user_id) AS rating_avg,
               req_item.title AS requested_item,
               off_item.title AS offered_item, off_item.size, off_item.color,
               sr.status, sr.created_at
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id   = off_item.item_id
        JOIN Users u_req ON off_item.user_id = u_req.user_id   -- requester = owner of offered item
        WHERE req_item.user_id = @user_id AND sr.status = 'pending'
        ORDER BY sr.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. VIEW OUTGOING SWAP REQUESTS ─────────────────────────────
exports.getOutgoingRequests = async (req, res) => {
  try {
    const pool = await poolPromise;
    const user_id = req.user.user_id;

    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT sr.swap_id,
               u_owner.username AS owner,
               req_item.title AS i_want,
               off_item.title AS i_offered,
               sr.status, sr.created_at
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id   = off_item.item_id
        JOIN Users u_owner ON req_item.user_id = u_owner.user_id   -- owner = owner of requested item
        WHERE off_item.user_id = @user_id   -- requester = owner of offered item
        ORDER BY sr.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. ACCEPT SWAP REQUEST ──────────────────────────────────────
exports.acceptSwapRequest = async (req, res) => {
  try {
    const pool = await poolPromise;
    const swap_id  = req.params.id;
    const user_id = req.user.user_id;

    // Fetch swap details to verify ownership and get requester id
    const swap = await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`
        SELECT req_item.user_id AS owner_id, off_item.user_id AS requester_id
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id   = off_item.item_id
        WHERE sr.swap_id = @swap_id AND sr.status = 'pending'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Swap request not found or not pending' });

    const { owner_id, requester_id } = swap.recordset[0];
    if (owner_id !== user_id) return res.status(403).json({ message: 'You can only accept requests for your own items' });

    // Update status to accepted
    await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`UPDATE SwapRequests SET status = 'accepted' WHERE swap_id = @swap_id`);

    // Notify requester
    await pool.request()
      .input('requester_id', sql.Int, requester_id)
      .input('swap_id',      sql.Int, swap_id)
      .query(`
        INSERT INTO Notifications (user_id, type, reference_id)
        VALUES (@requester_id, 'swap_accepted', @swap_id)
      `);

    res.json({ message: 'Swap request accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. REJECT SWAP REQUEST ──────────────────────────────────────
exports.rejectSwapRequest = async (req, res) => {
  try {
    const pool = await poolPromise;
    const swap_id  = req.params.id;
    const user_id = req.user.user_id;

    // Fetch swap details to verify ownership and get requester
    const swap = await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`
        SELECT req_item.user_id AS owner_id, off_item.user_id AS requester_id
        FROM SwapRequests sr
        JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item ON sr.offered_item_id   = off_item.item_id
        WHERE sr.swap_id = @swap_id AND sr.status = 'pending'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Swap request not found or not pending' });

    const { owner_id, requester_id } = swap.recordset[0];
    if (owner_id !== user_id) return res.status(403).json({ message: 'You can only reject requests for your own items' });

    // Update status to rejected
    await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`UPDATE SwapRequests SET status = 'rejected' WHERE swap_id = @swap_id`);

    // Notify requester
    await pool.request()
      .input('requester_id', sql.Int, requester_id)
      .input('swap_id',      sql.Int, swap_id)
      .query(`
        INSERT INTO Notifications (user_id, type, reference_id)
        VALUES (@requester_id, 'swap_rejected', @swap_id)
      `);

    res.json({ message: 'Swap request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 6. COMPLETE SWAP ────────────────────────────────────────────
exports.completeSwap = async (req, res) => {
  try {
    const pool = await poolPromise;
    const swap_id = req.params.id;

    // Fetch the swap, ensure status is 'accepted'
    const swap = await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`
        SELECT requested_item_id, offered_item_id
        FROM SwapRequests
        WHERE swap_id = @swap_id AND status = 'accepted'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Accepted swap not found' });

    const { requested_item_id, offered_item_id } = swap.recordset[0];

    // Update status to completed
    await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`UPDATE SwapRequests SET status = 'completed' WHERE swap_id = @swap_id`);

    // Mark both items as swapped
    await pool.request()
      .input('requested_item_id', sql.Int, requested_item_id)
      .input('offered_item_id',   sql.Int, offered_item_id)
      .query(`
        UPDATE WardrobeItems SET status = 'swapped' WHERE item_id = @requested_item_id;
        UPDATE WardrobeItems SET status = 'swapped' WHERE item_id = @offered_item_id;
      `);

    res.json({ message: 'Swap completed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 7. CANCEL SWAP REQUEST ──────────────────────────────────────
exports.cancelSwapRequest = async (req, res) => {
  try {
    const pool = await poolPromise;
    const user_id = req.user.user_id;
    const swap_id = req.params.id;

    // Only the requester (owner of offered item) can cancel, and status must be 'pending'
    await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .input('user_id', sql.Int, user_id)
      .query(`
        DELETE sr
        FROM SwapRequests sr
        JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
        WHERE sr.swap_id = @swap_id
          AND off_item.user_id = @user_id
          AND sr.status = 'pending'
      `);

    res.json({ message: 'Swap request cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};