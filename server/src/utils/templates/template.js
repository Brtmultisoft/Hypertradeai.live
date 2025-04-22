'use strict';
const config = require('../../config/config');
module.exports = {
      emailVerification: (data) => {
            let templateBody = `<h5>Hey ${data.name},</h5>
            <h4>Welcome to ${config.brandName},</h4>
            <br>Click the link below to verify your email address!
            <br><a style="text-decoration:none;line-height:100%;background:#7289DA;color:white;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank" href='${config.frontendUrl}/activation/${data.token}?type=${data.type}'>Verify Your Email</a>
            <br><p>This link will expire in 1 hour, so be sure to use it right away. Once you verify your email address, continue to log in.
            If you did not make this request, please ignore this email.</p>
            <br>Regards</br>
            <br>Team ${config.brandName}</br>`;
            return templateBody;
      },
      emailVerificationUser: (data) => {
            let templateBody = `<h5>Hey ${data.name},</h5>
            <h4>Welcome to ${config.brandName},</h4>
            <br>Click the link below to verify your email address!
            <br><a style="text-decoration:none;line-height:100%;background:#7289DA;color:white;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank" href='${config.frontendUrl}/activation/${data.token}?type=${data.type}'>Verify Your Email</a>
            <br><p>This link will expire in 1 hour, so be sure to use it right away. Once you verify your email address, continue to log in.
            If you did not make this request, please ignore this email.</p>
            <br><p>After email verification, you Can continue Login by using the below password.<br>Password: ${data.password}</p>
            <br>Regards</br>
            <br>Team ${config.brandName}</br>`;
            return templateBody;
      },
      passwordReset: (data) => {
            // let href = `${config.frontendUrl}/createpassword/${data.token}`
            let href = `${config.frontendUrl}/reset-password?token=${data.token}`
            let templateBody = `<h2>Hey there,</h2><br>Click the link below to change your password!
            <br><a style="text-decoration:none;line-height:100%;background:#7289DA;color:white;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank" href='${href}'>Change Password</a>
            <br><p>This link will expire in 1 hour, so be sure to use it right away. Once you change your password, remember to log in again with your new password to continue using your account.
            If you did not make this request, please ignore this email.</p>
            <br>Regards</br>
            <br>Team ${config.brandName}</br>`;
            return templateBody;
      },
      contactUs: (data) => {
            let templateBody = `<h4>Hey Admin,</h4>you have got mail from one of your user!
            <br>from,
            <br>name:${data.name},
            <br>email:${data.email},
            <br>phone:${data.phone},
            <br>Message:<p>${data.message}</p>`;
            return templateBody;
      },
};