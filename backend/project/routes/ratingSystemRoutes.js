const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  submitRating,
  deleteRating,
} = require('../controllers/ratingSystemController');

router.post('/',    auth, submitRating);
router.delete('/:id', auth, deleteRating);

module.exports = router;