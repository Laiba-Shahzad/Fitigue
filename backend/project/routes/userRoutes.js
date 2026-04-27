const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  getOwnProfile,
  getUserProfile,
  editProfile,
  changePassword,
  deleteAccount,
  checkUsername,
} = require('../controllers/userController');

router.post('/register',                    register);
//router.post('/login',                       login);
router.get('/profile/me',        auth,      getOwnProfile);
router.get('/profile/:id',       auth,      getUserProfile);
router.put('/profile',           auth,      editProfile);
router.put('/profile/password',  auth,      changePassword);
router.delete('/profile',        auth,      deleteAccount);
router.get('/check/:username',              checkUsername);
router.post('/login', (req, res) => {
  res.json({ message: "Route working" });
});

module.exports = router;