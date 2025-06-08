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
			console.log('=== EMAIL SERVICE DEBUG ===');
			console.log('Email service configuration:', {
				serviceActive: config.emailServiceInfo.serviceActive,
				fromEmail: config.emailServiceInfo.fromEmail,
				fromName: config.emailServiceInfo.fromName,
				smtpHost: config.emailServiceInfo.smtp.host,
				smtpPort: config.emailServiceInfo.smtp.port,
				smtpUser: config.emailServiceInfo.smtp.userName,
				smtpPasswordSet: !!config.emailServiceInfo.smtp.password
			});

			// send mail with defined transport object
			let emailInfo = {
				from: `"${config.emailServiceInfo.fromName}" <${config.emailServiceInfo.fromEmail}>`,
				to: emailBody.recipientsAddress, // list of receivers
				subject: emailBody.subject, // Subject line
				html: emailBody.body
			};

			console.log('Email info to send:', {
				from: emailInfo.from,
				to: emailInfo.to,
				subject: emailInfo.subject,
				bodyLength: emailInfo.html ? emailInfo.html.length : 0
			});

			if (config.emailServiceInfo.serviceActive == 'smtp') {
				console.log('Attempting to send email via SMTP...');

				// Test transporter connection first
				try {
					await transporter.verify();
					console.log('SMTP connection verified successfully');
				} catch (verifyError) {
					console.error('SMTP connection verification failed:', verifyError);
					throw new Error(`SMTP connection failed: ${verifyError.message}`);
				}

				let info = await transporter.sendMail(emailInfo);
				console.log("Message sent successfully: %s", info.messageId);
				console.log("Email response:", info.response);
				console.log('=== EMAIL SERVICE SUCCESS ===');
				return { success: true, messageId: info.messageId, response: info.response };
			} else {
				console.log('Email service is not active (serviceActive != smtp)');
				return { success: false, error: 'Email service not active' };
			}
		}
		catch (error) {
			console.error('=== EMAIL SERVICE ERROR ===');
			console.error('Error details:', {
				message: error.message,
				code: error.code,
				command: error.command,
				response: error.response,
				responseCode: error.responseCode,
				stack: error.stack
			});
			console.error('=== END EMAIL ERROR ===');
			throw error; // Re-throw the error instead of returning it
		}
	}
};
