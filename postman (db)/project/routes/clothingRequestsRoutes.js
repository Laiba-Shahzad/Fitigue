const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createClothingRequest,
  getAllClothingRequests,
  deleteClothingRequest,
} = require('../controllers/clothingRequestsController');

router.post('/',    auth, createClothingRequest);
router.get('/',          getAllClothingRequests);
router.delete('/:id', auth, deleteClothingRequest);

module.exports = router;