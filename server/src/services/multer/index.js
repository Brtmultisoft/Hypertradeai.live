'use strict';
const uuid = require('uuid/v4');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const config = require('../../config/config');
aws.config.update({
	secretAccessKey: config.aws.secretAccessKey,
	accessKeyId: config.aws.accessKeyId,
	region: config.aws.region
});
const s3 = new aws.S3();

function validateAndEncodeHeaderValue(value) {
    // Replace invalid characters (example: newline and special characters)
    const encodedValue = encodeURIComponent(value.replace(/[\r\n]/g, ''));
    return encodedValue;
}

/*const maxSize = 1 * 1000 * 1000;*/
let _fileStorage = (type) => {
	let bucketName = '';
	try {
		if (type === 'file') {
			//bucketName = config.aws.s3Bucket;
			bucketName = config.aws.s3AvatarBucket;
		} else if (type === 'avatar') {
			bucketName = config.aws.s3AvatarBucket;
		} else if (type === 'image') {
			bucketName = config.aws.s3Bucket;
		} else {
			return new Error('Invalid type for aws s3 service');
		}
		
		return multer({
			storage: multerS3({
				s3: s3,
				bucket: bucketName,
				contentType: multerS3.AUTO_CONTENT_TYPE,
				metadata: function (req, file, cb) {//eslint-disable-inline
					cb(null, {
						fileName: validateAndEncodeHeaderValue(file.originalname),
						mimetype: file.mimetype,
						/*fileSize: maxSize*/
					});
				},
				key: function (req, file, cb) {//eslint-disable-inine
					let uploadedFileName = uuid() + '-' + file.fieldname + Date.now() + path.extname(validateAndEncodeHeaderValue(file.originalname));
					cb(null, uploadedFileName);
				}
			})
		})
	} catch (error) {
		return error;
	}
};

let _deleteImageObject = (imgKey) => {
	let params = {
		Bucket: config.aws.s3Bucket,
		Key: imgKey
	};
	return new Promise((resolve, reject) => {
		s3.deleteObject(params, function (err, data) {
			if (err) reject(err.stack);	// an error occurred
			else resolve(data);	// successful response
		});
	});
}

let _getSignedUrl = (key) => {
    const params = {
        Bucket: config.aws.s3Bucket,
        Key: key,
        Expires: 60 * 60 // URL expiry time in seconds
    };
    return s3.getSignedUrl('getObject', params);
};


module.exports = {
	uploadFile: _fileStorage,
	deleteFile: _deleteImageObject,
	getSignedUrl: _getSignedUrl
};