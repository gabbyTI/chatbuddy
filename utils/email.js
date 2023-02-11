const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	// create a transporter
	const transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD,
		},
	});
	// define email options
	const mailOptions = {
		from: `${process.env.MAIL_FROM_ADDRESS} <${process.env.MAIL_FROM_NAME}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
		// html:
	};

	// send email with node mailer

	await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
