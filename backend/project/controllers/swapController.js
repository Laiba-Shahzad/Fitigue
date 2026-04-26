const { sql, poolPromise } = require('../config/db');

// ─── 1. SEND SWAP REQUEST ────────────────────────────────────────
exports.sendSwapRequest = async (req, res) => {
  try {
    const { owner_id, requested_item_id, offered_item_id } = req.body;
    const requester_id = req.user.user_id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('requester_id',     sql.Int, requester_id)
      .input('owner_id',         sql.Int, owner_id)
      .input('requested_item_id', sql.Int, requested_item_id)
      .input('offered_item_id',  sql.Int, offered_item_id)
      .query(`
        INSERT INTO SwapRequests (requester_id, owner_id, requested_item_id, offered_item_id, status)
        OUTPUT INSERTED.swap_id
        VALUES (@requester_id, @owner_id, @requested_item_id, @offered_item_id, 'pending')
      `);

    const swap_id = result.recordset[0].swap_id;

    // Notify owner of incoming swap request
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

    const result = await pool.request()
      .input('owner_id', sql.Int, req.user.user_id)
      .query(`
        SELECT sr.swap_id, u_req.username AS requester, u_req.profile_image,
               u_req.rating_avg,
               req_item.title AS requested_item,
               off_item.title AS offered_item, off_item.size, off_item.color,
               sr.status, sr.created_at
        FROM SwapRequests sr
        JOIN Users u_req             ON sr.requester_id      = u_req.user_id
        JOIN WardrobeItems req_item  ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item  ON sr.offered_item_id   = off_item.item_id
        WHERE sr.owner_id = @owner_id AND sr.status = 'pending'
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

    const result = await pool.request()
      .input('requester_id', sql.Int, req.user.user_id)
      .query(`
        SELECT sr.swap_id, u_owner.username AS owner,
               req_item.title AS i_want,
               off_item.title AS i_offered,
               sr.status, sr.created_at
        FROM SwapRequests sr
        JOIN Users u_owner           ON sr.owner_id          = u_owner.user_id
        JOIN WardrobeItems req_item  ON sr.requested_item_id = req_item.item_id
        JOIN WardrobeItems off_item  ON sr.offered_item_id   = off_item.item_id
        WHERE sr.requester_id = @requester_id
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
    const owner_id = req.user.user_id;

    // Fetch swap to get requester_id for notification
    const swap = await pool.request()
      .input('swap_id',  sql.Int, swap_id)
      .input('owner_id', sql.Int, owner_id)
      .query(`
        SELECT requester_id FROM SwapRequests
        WHERE swap_id = @swap_id AND owner_id = @owner_id AND status = 'pending'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Swap request not found' });

    const requester_id = swap.recordset[0].requester_id;

    // Update status to accepted
    await pool.request()
      .input('swap_id',  sql.Int, swap_id)
      .input('owner_id', sql.Int, owner_id)
      .query(`
        UPDATE SwapRequests SET status = 'accepted'
        WHERE swap_id = @swap_id AND owner_id = @owner_id
      `);

    // Notify requester of acceptance
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
    const owner_id = req.user.user_id;

    // Fetch swap to get requester_id for notification
    const swap = await pool.request()
      .input('swap_id',  sql.Int, swap_id)
      .input('owner_id', sql.Int, owner_id)
      .query(`
        SELECT requester_id FROM SwapRequests
        WHERE swap_id = @swap_id AND owner_id = @owner_id AND status = 'pending'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Swap request not found' });

    const requester_id = swap.recordset[0].requester_id;

    // Update status to rejected
    await pool.request()
      .input('swap_id',  sql.Int, swap_id)
      .input('owner_id', sql.Int, owner_id)
      .query(`
        UPDATE SwapRequests SET status = 'rejected'
        WHERE swap_id = @swap_id AND owner_id = @owner_id
      `);

    // Notify requester of rejection
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

    // Fetch both item IDs from the swap
    const swap = await pool.request()
      .input('swap_id', sql.Int, swap_id)
      .query(`
        SELECT requested_item_id, offered_item_id FROM SwapRequests
        WHERE swap_id = @swap_id AND status = 'accepted'
      `);

    if (!swap.recordset[0]) return res.status(404).json({ message: 'Accepted swap not found' });

    const { requested_item_id, offered_item_id } = swap.recordset[0];

    // Mark swap as completed
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

    await pool.request()
      .input('swap_id',      sql.Int, req.params.id)
      .input('requester_id', sql.Int, req.user.user_id)
      .query(`
        DELETE FROM SwapRequests
        WHERE swap_id = @swap_id AND requester_id = @requester_id AND status = 'pending'
      `);

    res.json({ message: 'Swap request cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};