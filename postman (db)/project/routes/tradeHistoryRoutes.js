const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTradeHistory,
  getSwapHistory,
  getTradeStatusCount,
  cancelTrade,
} = require('../controllers/tradeHistoryController');

router.get('/trades',        auth, getTradeHistory);
router.get('/swaps',         auth, getSwapHistory);
router.get('/trades/status', auth, getTradeStatusCount);
router.patch('/trades/:id',  auth, cancelTrade);

module.exports = router;