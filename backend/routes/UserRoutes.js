const express = require('express');
const router = express.Router();

const { signup, login, verifyToken, getUserInfo, logout, upload } = require('../controller/UserController');

router.post('/signup', upload.single('image'), signup);
router.post('/login', login);
router.get('/user', verifyToken, getUserInfo);
router.post('/logout', verifyToken, logout);

module.exports = router;
