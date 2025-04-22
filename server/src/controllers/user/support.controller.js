'use strict';
const logger = require('../../services/logger');
const log = new logger('SupportController').getChildLogger();
const { userDbHandler } = require('../../services/db');
const config = require('../../config/config');
const emailService = require('../../services/sendEmail');
const responseHelper = require('../../utils/customResponse');
const templates = require('../../utils/templates/template');

module.exports = {

    /**
     * Method to handle user support
     */
    add: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for user support:', reqObj);
        let responseData = {};
        console.log(reqObj);
        try {
            let userData = await userDbHandler.getById(id, { password: 0 });

            //patch support templateBody
            let templateBody = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone_number,
                message: reqObj.message
            };
            let emailBody = {
                recipientsAddress: config.emailServiceInfo.supportEmail,
                subject: `${config.brandName} Support Mail: ${reqObj.subject}`,
                body: templates.contactUs(templateBody)
            };
            let emailInfo = await emailService.sendEmail(emailBody);
            if (emailInfo) {
                log.info('support mail sent successfully', emailInfo);
                responseData.msg = `Your support mail has sent to ${config.brandName} team`;
                return responseHelper.success(res, responseData);
            }
        } catch (error) {
            log.error('failed to send support mail with error::', error);
            responseData.msg = 'Failed to send support mail';
            return responseHelper.error(res, responseData);
        }
    }
};