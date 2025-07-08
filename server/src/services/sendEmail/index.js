'use strict';
const axios = require('axios');
const config = require('../../config/config');

const ZOHO_API_URL = "https://api.zeptomail.in/v1.1/email";
const ZOHO_API_KEY = process.env.ZEPTOMAIL_API_KEY || config.emailServiceInfo.zeptomailApiKey;
const FROM_EMAIL = config.emailServiceInfo.fromEmail || process.env.ZEPTOMAIL_FROM_EMAIL || "no-reply@yourdomain.com";
const FROM_NAME = config.emailServiceInfo.fromName || process.env.ZEPTOMAIL_FROM_NAME || "Support";

module.exports = {
	sendEmail: async (emailBody) => {
		try {
			console.log('=== ZOHO EMAIL SERVICE DEBUG ===');
			console.log('From:', FROM_EMAIL, 'To:', emailBody.recipientsAddress, 'Subject:', emailBody.subject);

			const payload = {
				from: { address: FROM_EMAIL, name: FROM_NAME },
				to: [{ email_address: { address: emailBody.recipientsAddress } }],
				subject: emailBody.subject,
				htmlbody: emailBody.body,
			};

			const response = await axios.post(ZOHO_API_URL, payload, {
				headers: {
					"accept": "application/json",
					"authorization": ZOHO_API_KEY,
					"cache-control": "no-cache",
					"content-type": "application/json",
				}
			});

			console.log('Zoho email sent. Response:', response.data);
			return { success: true, data: response.data };
		} catch (error) {
			console.error('=== ZOHO EMAIL SERVICE ERROR ===');
			if (error.response) {
				console.error('Error response:', error.response.data);
			} else {
				console.error('Error:', error.message);
			}
			throw error;
		}
	}
};
