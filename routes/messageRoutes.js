const express = require('express');
const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// router.route('/').post(messageController.sendMessage);
router.get('/all/:chat', messageController.getAllChatMessages);
router.post('/send-new', messageController.sendNewMessage);
router.post('/send-in-chat/:chat', messageController.sendMessageInChat);

module.exports = router;
