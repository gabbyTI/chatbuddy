const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new mongoose.Schema({
	uuid: {
		type: String,
		default: uuidv4,
		required: true,
		unique: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Chat must belong to a user'],
	},
	title: {
		type: String,
		required: [true, 'Chat must have a title'],
	},
	lastPrompt: {
		type: String,
	},
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
