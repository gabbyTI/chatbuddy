/* eslint-disable import/no-extraneous-dependencies */
const { Configuration, OpenAIApi } = require('openai');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.sendMessage = catchAsync(async (req, res, next) => {
	// Find the chat using the uuid and user id provided in the request
	const chat = await Chat.findOne({ uuid: req.params.chat, user: req.user.id });

	// If no chat was found with the provided information
	if (!chat) {
		// Return an error indicating that no chat was found
		return next(
			new AppError(
				'No chat found with that ID or the chat does not belong to the user',
				404
			)
		);
	}

	// Get the message that the user sent
	const userMessage = req.body.message;

	// Create a new message document for the user's message
	const newMessage = await Message.create({
		chat: chat._id,
		sender: 'user',
		message: userMessage,
	});

	// Determine the prompt for the OpenAI API call. If there is a last prompt,
	// add the user message to it, otherwise use the user message as the prompt
	const prompt = chat.lastPrompt
		? `${chat.lastPrompt}\n\n${userMessage}\n`
		: `${userMessage}\n`;

	// Call the OpenAI API to generate a response
	const response = await openai.createCompletion({
		prompt: prompt,
		model: 'text-davinci-003',
		temperature: 1,
		max_tokens: 256,
	});

	console.log(response.data);
	// Get the chatbot's response
	const chatbotMessage = response.data.choices[0].text;

	// Create a new message document for the chatbot's response
	const chatbotResponse = await Message.create({
		chat: chat._id,
		sender: 'chatbot',
		message: chatbotMessage,
		isBotReply: true,
	});

	// Update the chat document with the new last prompt
	chat.lastPrompt = `${prompt}${chatbotMessage}`;
	await chat.save({ validateBeforeSave: false });

	// Return the chatbot response and the user message in the response
	res.status(200).json({
		status: 'success',
		data: {
			chatbotResponse: chatbotResponse,
			userMessage: newMessage,
		},
	});
});
