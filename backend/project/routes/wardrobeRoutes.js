const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  addItem,
  getMyWardrobe,
  getItem,
  editItem,
  updateStatus,
  deleteItem,
  updateItemImage,
  deleteItemImage
} = require('../controllers/wardrobeController');

router.post('/',                    auth, upload.single('image'), addItem);
router.get('/my',                       auth, getMyWardrobe);
router.get('/:id',                      auth, getItem);
router.put('/:id',                      auth, editItem);
router.patch('/:id/status',             auth, updateStatus);
router.patch('/:id/image',          auth, upload.single('image'), updateItemImage);
router.delete('/:id/image',         auth, deleteItemImage);
router.delete('/:id',                   auth, deleteItem);

module.exports = router;