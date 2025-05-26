'use strict';
/*************************************
 * SERVICE FOR HANDLING API RESPONSE
 *************************************/
module.exports = {
	/**
	* Helper Method to handle API success Response
	*/
	success: (res, body = { msg: 'Action completed successfully', data: {}, result: null }) => {
		// For backward compatibility, include both result and data fields
		const response = {
			status: true,
			message: body.msg,
			data: body.data,  // Include data field
			result: body.result || body.data  // Include result field, defaulting to data if not provided
		};

		console.log('Sending success response:', response);
		return res.status(200).send(response);
	},
	success2: (res, body = { msg: 'Action completed successfully', data: {} }) => {
		return res.status(200).send({
			status: false,
			message: body.msg,
			result: body.data
		});
	},
	/**
	* Helper Method to handle API error Response
	*/
	error: (res, body = { msg: 'failed to process request' }) => {
		return res.status(403).send({
			status: false,
			message: body.msg,
			error: body?.error
		});
	},
	/**
	* Helper Method to handle API forbidden Response (for blocked users)
	*/
	forbidden: (res, body = { msg: 'Your account has been blocked', block_reason: 'No reason provided' }) => {
		return res.status(403).send({
			status: false,
			message: body.msg,
			block_reason: body.block_reason
		});
	},
	/**
	* Helper Method to handle API unauthorize Response
	*/
	unAuthorize: (res, body = { msg: 'unauthorize request' }) => {
		return res.status(401).send({
			status: false,
			message: body.msg
		});
	}
};