const express = require('express');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
	.route('/')
	.get(chatController.getAllChats)
	.post(authController.restrictedTo('user'), chatController.createChat);

router
	.route('/:uuid')
	.get(chatController.getChat)
	.patch(chatController.updateChat)
	.delete(chatController.deleteChat);

module.exports = router;
