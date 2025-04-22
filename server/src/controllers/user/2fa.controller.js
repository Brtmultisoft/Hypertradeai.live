'use strict';
const logger = require('../../services/logger');
const log = new logger('2faController').getChildLogger();
const { userDbHandler, verificationDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');

const qrcode = require("qrcode");
const { authenticator } = require("otplib");

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {

  generate2faSecret: async (req, res) => {
    let reqObj = req.body;
    log.info('Recieved request for User 2FA Secret:', reqObj);
    let responseData = {};
    try {
      let query = {
        email: req.user.email
      }
      const user = await userDbHandler.getOneByQuery(query);

      if (user.two_fa_enabled) {
        responseData.msg = "2FA already verified and enabled!";
        responseData.data = { two_fa_enabled: user.two_fa_enabled };
        return responseHelper.error(res, responseData);
      }

      const secret = authenticator.generateSecret();
      user.two_fa_secret = secret;
      user.save();
      const appName = `${config.brandName} 2FA`;

      responseData.msg = `2FA secret generation successfully!`;
      responseData.data = {
        secret: secret,
        qrImageDataUrl: await qrcode.toDataURL(
          authenticator.keyuri(user.email, appName, secret)
        ),
        two_fa_enabled: user.two_fa_enabled,
      };
      return responseHelper.success(res, responseData);
    } catch (error) {
      log.error('failed to get user 2fa secret with error::', error);
      responseData.msg = 'Failed to get user 2fa secret';
      return responseHelper.error(res, responseData);
    }
  },

  verifyOtp: async (req, res) => {
    let reqObj = req.body;
    log.info('Recieved request for User 2FA verify Otp:', reqObj);
    let responseData = {};
    try {
      let query = {
        email: req.user.email
      }
      const user = await userDbHandler.getOneByQuery(query);
      if (user.two_fa_enabled) {
        responseData.msg = "2FA already verified and enabled!";
        responseData.data = { two_fa_enabled: user.two_fa_enabled };
        return responseHelper.error(res, responseData);
      }

      const token = reqObj.token.replaceAll(" ", "");
      if (!authenticator.check(token, user.two_fa_secret)) {
        responseData.msg = "The entered OTP is invalid!";
        responseData.data = { two_fa_enabled: user.two_fa_enabled };
        return responseHelper.error(res, responseData);
      } else {
        user.two_fa_enabled = true;
        user.save();

        responseData.msg = `2FA enabled successfully!`;
        responseData.data = {
          two_fa_enabled: user.two_fa_enabled,
        };
        return responseHelper.success(res, responseData);
      }
    } catch (error) {
      log.error('failed to get user 2fa verify Otp with error::', error);
      responseData.msg = 'Failed to get user 2fa verify Otp';
      return responseHelper.error(res, responseData);
    }
  },

  disable2fa: async (req, res) => {
    let reqObj = req.body;
    log.info('Recieved request for User 2FA Disable:', reqObj);
    let responseData = {};
    try {
      let query = {
        email: req.user.email
      }
      const user = await userDbHandler.getOneByQuery(query);

      const token = reqObj?.token.replaceAll(" ", "");
      if (!authenticator.check(token, user.two_fa_secret)) {
        responseData.msg = "The entered OTP is invalid!";
        responseData.data = { two_fa_enabled: user.two_fa_enabled };
        return responseHelper.error(res, responseData);
      } else {
        user.two_fa_enabled = false;
        user.two_fa_secret = "";
        await user.save();

        responseData.msg = `2FA disabled successfully!`;
        responseData.data = {
          two_fa_enabled: user.two_fa_enabled,
        };
        return responseHelper.success(res, responseData);
      }
    } catch (error) {
      log.error('failed to get user 2fa disable with error::', error);
      responseData.msg = 'Failed to get user 2fa disable';
      return responseHelper.error(res, responseData);
    }
  },



  /**
   * Method to handle user login
   */
  login: async (req, res) => {
    let reqObj = req.body;
    log.info('Recieved request for User 2FA:', reqObj);
    let responseData = {};
    try {
      let query = {
        email: reqObj.email
      }
      let getUser = await userDbHandler.getByQuery(query);
      if (!getUser.length) {
        responseData.msg = "Invalid Credentials!";
        return responseHelper.error(res, responseData);
      }
      let checkPassword = await _comparePassword(reqObj.password, getUser[0].password);
      console.log();
      if (!checkPassword) {
        responseData.msg = "Invalid Credentials!";
        return responseHelper.error(res, responseData);
      }
      if (!getUser[0].email_verified) {
        responseData.msg = "Email not verified yet!";
        return responseHelper.error(res, responseData);
      }
      if (!getUser[0].status) {
        responseData.msg = "Your account is Disabled please contact to admin!";
        return responseHelper.error(res, responseData);
      }

      let time = new Date().getTime();
      let tokenData = {
        sub: getUser[0]._id,
        email: getUser[0].email,
        name: getUser[0].name,
        time: time
      };

      let updatedObj = {
        force_relogin_time: time,
        force_relogin_type: 'session_expired'
      }
      await userDbHandler.updateById(getUser[0]._id, updatedObj);

      let token = _generateUserToken(tokenData);
      let returnResponse = {
        user_id: getUser[0]._id,
        name: getUser[0].name,
        email: getUser[0].email,
        email_verify: getUser[0].email_verified,
        token: token
      }
      responseData.msg = `Welcome ${getUser[0].username} !`;
      responseData.data = returnResponse;
      return responseHelper.success(res, responseData);

    } catch (error) {
      log.error('failed to get user 2fa with error::', error);
      responseData.msg = 'Failed to get user 2fa';
      return responseHelper.error(res, responseData);
    }
  },
};