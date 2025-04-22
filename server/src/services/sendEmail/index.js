'use strict';
const nodeMailer = require('nodemailer');
const config = require('../../config/config');

const transporter = nodeMailer.createTransport({
	host: config.emailServiceInfo.smtp.host,
	port: config.emailServiceInfo.smtp.port,
	secure: false,
	auth: {
		user: config.emailServiceInfo.smtp.userName,
		pass: config.emailServiceInfo.smtp.password
	}
});

module.exports = {
	sendEmail: async (emailBody) => {
		try {
			// send mail with defined transport object
			let emailInfo = {
				from: `"${config.emailServiceInfo.fromName}" <${config.emailServiceInfo.fromEmail}>`,
				//from: config.emailServiceInfo.fromEmail, // sender address
				to: emailBody.recipientsAddress, // list of receivers
				subject: emailBody.subject, // Subject line
				html: emailBody.body
			};
			if (config.emailServiceInfo.serviceActive == 'smtp') {
				let info = await transporter.sendMail(emailInfo);
				console.log("Message sent: %s", info.messageId);
			}

			return true;
		}
		catch (error) {
			return error;
		}
	}
};
