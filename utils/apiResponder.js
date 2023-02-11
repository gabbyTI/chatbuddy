const ResponseStatus = require('./responseStatus');

exports.successResponse = ({
	response,
	message,
	data = null,
	code = ResponseStatus.HTTP_OK,
}) =>
	response.status(code).json({
		success: true,
		message: message,
		code: code,
		data: data,
	});

exports.failureResponse = ({ response, message, data = null, code }) =>
	response.status(code).json({
		status: false,
		message: message,
		code: code,
		data: data,
	});
