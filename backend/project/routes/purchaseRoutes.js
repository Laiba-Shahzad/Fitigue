const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  buyItem,
  getMyPurchases,
  getMySales,
} = require('../controllers/purchaseController');

router.post('/',          auth, buyItem);
router.get('/purchases',  auth, getMyPurchases);
router.get('/sales',      auth, getMySales);

module.exports = router;