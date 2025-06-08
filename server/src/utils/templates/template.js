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
      otpEmail: (data) => {
            let templateBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #333; margin: 0;">${config.brandName}</h2>
                        <p style="color: #666; margin: 5px 0 0 0;">Secure Authentication</p>
                    </div>

                    <h3 style="color: #333; margin-bottom: 20px;">Your Verification Code</h3>

                    <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                        Hello,<br><br>
                        You have requested a verification code for your ${config.brandName} account.
                        Please use the following code to complete your ${data.purpose || 'authentication'}:
                    </p>

                    <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                            ${data.otp}
                        </h1>
                    </div>

                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>⚠️ Important:</strong> This code will expire in ${Math.floor((data.expiry || 300) / 60)} minutes.
                            Do not share this code with anyone.
                        </p>
                    </div>

                    <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                        If you didn't request this code, please ignore this email or contact our support team
                        if you have concerns about your account security.
                    </p>

                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            This is an automated message from ${config.brandName}. Please do not reply to this email.
                        </p>
                        <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                            © ${new Date().getFullYear()} ${config.brandName}. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>`;
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