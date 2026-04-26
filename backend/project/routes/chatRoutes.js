const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  startConversation,
  sendMessage,
  getChatbox,
  getChatHistory,
  deleteMessage,
  deleteConversation,
  getUnreadCount,
} = require('../controllers/chatController');

router.post('/',                              auth, startConversation);
router.post('/:id/messages',                  auth, sendMessage);
router.get('/',                               auth, getChatbox);
router.get('/unread',                         auth, getUnreadCount);
router.get('/:id/messages',                   auth, getChatHistory);
router.delete('/:id/messages/:messageId',     auth, deleteMessage);
router.delete('/:id',                         auth, deleteConversation);

module.exports = router;