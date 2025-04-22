'use strict';
const logger = require('../../services/logger');
const log = new logger('UploadController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    upload: async (req, res) => {
        //let user = req.user;
        //let user_id = user.sub;
        let responseData = {};
        try {
            let data = req.file.location;
            responseData.msg = "File uploaded successfully!";
            responseData.data = data;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to upload file with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

};