const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		sender: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: [true, 'You must input a message'],
		},
		isBotReply: {
			type: Boolean,
			required: true,
			default: false,
		},
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Chat',
			required: [true, 'Message must belong to a chat'],
		},
	},
	{
		timestamps: true,
	}
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
