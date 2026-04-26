const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendSwapRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  completeSwap,
  cancelSwapRequest,
} = require('../controllers/swapController');

router.post('/',                      auth, sendSwapRequest);
router.get('/incoming',               auth, getIncomingRequests);
router.get('/outgoing',               auth, getOutgoingRequests);
router.patch('/:id/accept',           auth, acceptSwapRequest);
router.patch('/:id/reject',           auth, rejectSwapRequest);
router.patch('/:id/complete',         auth, completeSwap);
router.delete('/:id/cancel',          auth, cancelSwapRequest);

module.exports = router;