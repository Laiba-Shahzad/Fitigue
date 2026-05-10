const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createNotification,
  getAllNotifications,
  getUnreadNotifications,
  countUnreadNotifications,
  markAsRead,
  respondToNotification,
  deleteReadNotifications,
} = require('../controllers/notificationSystemController');

router.post('/',            auth, createNotification);
router.get('/',             auth, getAllNotifications);
router.get('/unread',       auth, getUnreadNotifications);
router.get('/unread/count', auth, countUnreadNotifications);
router.patch('/:id/respond', auth, respondToNotification);
router.patch('/:id',        auth, markAsRead);
router.patch('/:id/read',   auth, markAsRead);
router.delete('/read',      auth, deleteReadNotifications);

module.exports = router;