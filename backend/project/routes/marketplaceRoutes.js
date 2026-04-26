const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  postListing,
  getAllListings,
  getUserListings,
  removeListing,
  getListingDetail,
  filterListings,
} = require('../controllers/marketplaceController');

router.post('/',                    auth, postListing);
router.get('/',                          getAllListings);
router.get('/filter',                    filterListings);
router.get('/user/:userId',         auth, getUserListings);
router.get('/:id',                       getListingDetail);
router.delete('/:id',               auth, removeListing);

module.exports = router;