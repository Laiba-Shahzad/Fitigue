const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addItem,
  getMyWardrobe,
  getItem,
  editItem,
  updateStatus,
  deleteItem,
} = require('../controllers/wardrobeController');

router.post('/',                        auth, addItem);
router.get('/my',                       auth, getMyWardrobe);
router.get('/:id',                      auth, getItem);
router.put('/:id',                      auth, editItem);
router.patch('/:id/status',             auth, updateStatus);
router.delete('/:id',                   auth, deleteItem);

module.exports = router;