const express = require('express');
const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/send/:chat', messageController.sendMessage);

module.exports = router;
