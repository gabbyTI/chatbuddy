/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new mongoose.Schema(
	{
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
		type: {
			type: String,
			enum: ['individual', 'group'],
			default: 'individual',
		},
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
				required: function () {
					return this.type === 'group';
				},
			},
		],
		maxMembers: {
			type: Number,
			default: 5,
		},
		title: {
			type: String,
			required: [true, 'Chat must have a title'],
		},
		lastPrompt: {
			type: String,
		},
		total_tokens: {
			type: Number,
		},
	},
	{
		timestamps: true,
	}
);
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
