const { Configuration, OpenAIApi } = require('openai');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const catchAsync = require('../utils/catchAsync');

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const truncateMessage = (msg) => {
	const words = msg.split(' ');
	let shortMessage = '';
	let i = 0;
	do {
		shortMessage += `${words[i]} `;
		i++;
	} while (i < 10 && i < words.length);
	return `${shortMessage}...`;
};

exports.sendNewMessage = catchAsync(async (req, res, next) => {
	// Get the message that the user sent
	const userMessage = req.body.message;

	const chat = await Chat.create({
		user: req.user.id,
		title: truncateMessage(userMessage),
	});

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

	// Get the chatbot's response
	const chatbotMessage = response.data.choices[0].text;

	// Create a new message document for the chatbot's response
	const chatbotResponse = await Message.create({
		chat: chat._id,
		sender: 'chatbot',
		message: chatbotMessage,
		isBotReply: true,
	});

	// Update the chat document with the new last prompt and total tokens used
	chat.lastPrompt = `${prompt}${chatbotMessage}`;
	chat.total_tokens = response.data.usage.total_tokens;
	await chat.save({ validateBeforeSave: false });

	// Return the chatbot response and the user message in the response
	res.status(200).json({
		status: 'success',
		data: {
			chat_uuid: chat.uuid,
			chatbotResponse: chatbotResponse,
			userMessage: newMessage,
		},
	});
});

exports.sendMessageInChat = catchAsync(async (req, res, next) => {
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

	// Get the chatbot's response
	const chatbotMessage = response.data.choices[0].text;

	// Create a new message document for the chatbot's response
	const chatbotResponse = await Message.create({
		chat: chat._id,
		sender: 'chatbot',
		message: chatbotMessage,
		isBotReply: true,
	});

	// Update the chat document with the new last prompt and total tokens used
	// Also a check to see if tokens used in chat is above 1000. if so lastPrompt is emptied which is equivalent to the chatbot forgetting about previous questions
	chat.lastPrompt =
		response.data.usage.total_tokens >= 1000
			? ''
			: `${prompt}${chatbotMessage}`;
	chat.total_tokens =
		response.data.usage.total_tokens >= 1000
			? 0
			: response.data.usage.total_tokens;
	await chat.save({ validateBeforeSave: false });

	console.log(chat.total_tokens);
	// Return the chatbot response and the user message in the response
	res.status(200).json({
		status: 'success',
		data: {
			chatbotResponse: chatbotResponse,
			userMessage: newMessage,
		},
	});
});

exports.getAllChatMessages = catchAsync(async (req, res, next) => {
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

	const features = new APIFeatures(Message.find({ chat: chat._id }), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();

	const messages = await features.query;

	res.status(200).json({
		status: 'success',
		count: messages.length,
		data: messages,
	});
});
