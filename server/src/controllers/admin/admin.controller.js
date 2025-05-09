'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminController').getChildLogger();
const { adminDbHandler, userLoginRequestDbHandler, userDbHandler, incomeDbHandler, settingDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const crypto = require('crypto');
const mongoose = require('mongoose')

const { setup } = require('./setup.controller');
const { userModel, incomeModel } = require('../../models');

const { parse } = require('json2csv');
const { levelIncome } = require('../user/cron.controller');
const investmentModel = require('../../models/investment.model');

/*******************
 * PRIVATE FUNCTIONS
 ********************/

/**
 * Method to Compare password
 */
let _comparePassword = (reqPassword, userPassword) => {
    return new Promise((resolve, reject) => {
        //compare password with bcrypt method, password and hashed password both are required
        bcrypt.compare(reqPassword, userPassword, function (err, isMatch) {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};

// Method to create hash password on update
let _createHashPassword = async (password) => {
    let salt = config.bcrypt.saltValue;
    const saltpass = await bcrypt.genSalt(salt);
    // now we set user password to hashed password
    let hashedPassword = await bcrypt.hash(password, saltpass);
    return hashedPassword;
}
let acceptedMedias = ["x.com", "linkedin.com", "facebook.com", "first_youtube", "second_youtube", "third_youtube", "share_first_youtube", "share_second_youtube", "share_third_youtube", "instagram.com"]

function checkMediaExistence(input) {
    const lowercasedInput = input.toLowerCase()
    const existingMedia = acceptedMedias.filter(media => lowercasedInput.includes(media));
    return existingMedia || null
}
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {

    getReportsInCSV: async (req, res) => {
        let admin = req.admin;
        let admin_id = admin.sub;

        let typeOfReport = req.params.type;

        log.info('Recieved request for Getting report in csv form:', admin_id, typeOfReport);
        let responseData = {};
        try {

            let data;

            switch (typeOfReport) {
                case 'allUsers':
                    data = await userDbHandler.getByQueryToArray({}, {
                        name: 1,
                        email: 1,
                        phone_number: 1,
                        wallet: 1,
                        wallet_topup: 1,
                        created_at: 1,
                        "extra.levelIncome": 1,
                        "extra.tasksIncome": 1,
                        "extra.levelIncome_withdrawal": 1,
                        "extra.tasksIncome_withdrawal": 1
                    })
                    break;
                case 'income-type-0':
                    data = await incomeDbHandler.getByQueryToArray(
                        {
                            type: 0
                        },
                        {
                            user_id: 1,
                            "extra.mediaType": 1,
                            amount: 1,
                            created_at: 1
                        }).lean()
                    break;
                case 'income-type-1':
                    data = await incomeDbHandler.getByQueryToArray(
                        {
                            type: 1
                        },
                        {
                            user_id: 1,
                            user_id_from: 1,
                            amount: 1,
                            created_at: 1
                        }).lean()
                    break;
                default:
                    throw "Wrong Type!"
            }

            if (data.length === 0) throw "No Data Found"

            const csv = parse(data);
            res.setHeader('Content-Disposition', `attachment; filename=${typeOfReport}.csv`);
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);

        } catch (error) {
            log.error('Fetching error:', error);
            responseData.msg = error;
            return responseHelper.error(res, responseData);
        }
    },

    get_all_users_data: async (req, res) => {

        let admin = req.admin;
        let admin_id = admin.sub;

        log.info('Recieved request for Getting all users data:', admin_id);
        let responseData = {};
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0); // Start of the day (00:00:00.000)

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999); // End of the day (23:59:59.999)

            const result2 = await investmentModel.aggregate([
              {
                $match: {
                  created_at: { $gte: startOfDay, $lte: endOfDay  }, // Filter investments created today
                  type: 0
                }
              },
              {
                $group: {
                  _id: null, // Group all documents into a single group
                  totalAmount: { $sum: "$amount" }, // Sum the `amount` field
                  totalCount: { $sum: 1 }
                }
              }
            ]).catch(e => { throw e });

            const totalAmount = result2.length > 0 ? result2[0].totalAmount : 0;
            const totalCount = result2.length > 0 ? result2[0].totalCount : 0;
            const result = await userModel.aggregate([
                {
                    $group: {
                        _id: null, // Group all documents together
                        wallet: { $sum: "$wallet" },
                        wallet_topup: { $sum: "$wallet_topup" },
                        dailyIncome: { $sum: "$extra.dailyIncome" },
                        directIncome: { $sum: "$extra.directIncome" },
                        vipIncome: { $sum: "$extra.vipIncome" },
                        matchingIncome: { $sum: "$extra.matchingIncome" },
                        deposits: { $sum: "$extra.deposits" },
                        withdrawals: { $sum: "$extra.withdrawals" },
                        tokens: { $sum: "$extra.tokens" },
                        tasksIncome: { $sum: "$extra.tasksIncome" },
                        levelIncome: { $sum: "$extra.levelIncome" },
                        tasksIncome_withdraw: { $sum: "$extra.tasksIncome_withdraw" },
                        levelIncome_withdraw: { $sum: "$extra.levelIncome_withdraw" },
                        totalIncome: { $sum: "$extra.totalIncome" },
                        gas_wallet: { $sum: "$extra.gas_wallet" },
                        totalInvestment: { $sum: "$total_investment" },
                        provisionIncome: { $sum: "$extra.provisionIncome" },
                        matrixIncome: { $sum: "$extra.matrixIncome" },
                        userCount : { $sum: 1 },
                    }
                }
            ]).catch(e => { throw e })



            // Extract the total amount from the result


            responseData.data = result.length > 0 ? result[0] : []
            responseData.data.totalAmount = totalAmount
            responseData.data.totalCount = totalCount
            return responseHelper.success(res, responseData)
        } catch (error) {
            log.error('failed to get all users data with error::', error);
            responseData.msg = 'Failed to get Data';
            return responseHelper.error(res, responseData);
        }

    },


    reset_db: async (req, res) => {

        let admin = req.admin;
        let admin_id = admin.sub;

        log.info('Recieved request for Reset Through Admin:', admin_id);

        let responseData = {};
        try {

            const collections = await mongoose.connection.db.collections();

            for (let collection of collections) {
                try {
                    await collection.drop();
                    console.log(`Dropped collection: ${collection.collectionName}`);
                } catch (err) {
                    // Handle the error
                    if (err.message === 'ns not found') {
                        console.log(`Collection ${collection.collectionName} does not exist.`);
                    } else {
                        console.error(`Failed to drop collection ${collection.collectionName}`, err);
                    }
                }
            }

            await setup(req, res, "Success, Now Login for ADMIN and USER Creation to use your app!")

        } catch (e) {

            log.error('failed to get login request with error::', e);
            responseData.msg = 'Failed to reset DB';
            return responseHelper.error(res, responseData);

        }

    },
    resetDeviceToken: async (req, res) => {
        const { user_id } = req.body; // Extract user ID from the request body
        let responseData = {};

        log.info('Received request to reset device token for user ID:', user_id);

        try {
            // Validate the user ID
            if (!user_id) {
                responseData.msg = 'User ID is required!';
                return responseHelper.error(res, responseData);
            }

            // Fetch user data
            const userData = await userDbHandler.getById(user_id, { password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user!';
                return responseHelper.error(res, responseData);
            }

            // Update the user's device token to an empty string (do not modify other fields)


            // Optionally, fetch the updated user data (if you want to return the updated user object)
            const userUpdatedData = await userDbHandler.getById(user_id, { password: 0 });

            // Prepare the response
            responseData.data = userUpdatedData;
            responseData.msg = 'Device token reset successfully!';

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error resetting device token:', error);
            responseData.msg = 'Failed to reset device token.';
            return responseHelper.error(res, responseData);
        }
    },



    user_login_request: async (req, res) => {
        let reqObj = req.body;
        let admin = req.admin;
        let admin_id = admin.sub;
        log.info('Received request for Login A User Through :', req.body);
        log.info('Received request for Login A User Through Admin:', req.query);
        log.info('Received request for Login A User Through Admin:', reqObj);
        let responseData = {};
        try {
            // Validate user_id parameter
            if (!reqObj?.user_id) {
                log.error("Unable to read user_id!");
                responseData.msg = "User ID is required";
                return responseHelper.error(res, responseData);
            }

            // Check if the user exists
            const user = await userDbHandler.getById(reqObj.user_id);
            if (!user) {
                log.error(`User not found with ID: ${reqObj.user_id}`);
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
            }

            // Delete any existing login requests to prevent conflicts
            try {
                // Delete all existing login requests (not just for this user)
                // This ensures no other sessions can be active
                const deleteResult = await userLoginRequestDbHandler.updateByQuery(
                    {}, // Empty query to match all documents
                    { deleted: true }
                );
                log.info(`Cleaned up ${deleteResult.modifiedCount || 0} existing login requests`);
            } catch (deleteError) {
                log.warn(`Error cleaning up old login requests: ${deleteError}`);
                // Continue processing even if cleanup fails
            }

            // Invalidate existing user sessions when an admin logs in as a user
            try {
                // Generate a timestamp that's guaranteed to be unique and increasing
                const now = new Date().getTime();

                // Update all users EXCEPT the one we're logging in as to force relogin
                const forceReloginResult = await userDbHandler.updateByQuery(
                    {
                        _id: { $ne: reqObj.user_id } // Exclude the user we're logging in as
                    },
                    {
                        force_relogin_time: now,
                        force_relogin_type: 'admin_forced_logout'
                    }
                );
                log.info(`Forced relogin for ${forceReloginResult.modifiedCount || 0} users with timestamp ${now}`);

                // Update the specific user we're logging in as with admin login info
                // but DON'T set force_relogin_time or force_relogin_type
                const userUpdateResult = await userDbHandler.updateById(
                    reqObj.user_id,
                    {
                        last_admin_login: new Date(),
                        last_admin_id: admin_id,
                        admin_login_active: true
                    }
                );
                log.info(`Updated user ${reqObj.user_id} with admin login info`);
            } catch (forceReloginError) {
                log.warn(`Error forcing relogin for users: ${forceReloginError}`);
                // Continue processing even if force relogin fails
            }

            // Generate a secure random hash with high entropy
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const timestamp = Date.now().toString();
            const hash = crypto.createHash('sha256')
                .update(randomBytes + timestamp + admin_id + reqObj.user_id)
                .digest('hex');

            // Create the login request with additional metadata
            let loginRequest;
            try {
                const loginRequestData = {
                    hash,
                    admin_id,
                    user_id: reqObj.user_id,
                    created_at: new Date(),
                    expires_at: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes (increased from 5 minutes)
                };

                // Add metadata if supported by the database schema
                try {
                    loginRequestData.metadata = {
                        admin_username: admin.username || 'unknown',
                        user_username: user.username,
                        ip: req.ip || 'unknown',
                        user_agent: req.headers['user-agent'] || 'unknown'
                    };
                } catch (metadataError) {
                    log.warn(`Could not add metadata to login request: ${metadataError.message}`);
                    // Continue without metadata if not supported
                }

                loginRequest = await userLoginRequestDbHandler.create(loginRequestData);
                log.info(`Created login request with ID: ${loginRequest._id}`);
            } catch (createError) {
                log.error(`Error creating login request with extended fields: ${createError.message}`);
                // Try a simpler version without the new fields if the first attempt fails
                try {
                    loginRequest = await userLoginRequestDbHandler.create({
                        hash,
                        admin_id,
                        user_id: reqObj.user_id
                    });
                    log.info(`Created simplified login request with ID: ${loginRequest._id}`);
                } catch (fallbackError) {
                    log.error(`Failed to create even simplified login request: ${fallbackError.message}`);
                    throw new Error('Failed to create login request: ' + fallbackError.message);
                }
            }

            if (!loginRequest) {
                throw new Error('Failed to create login request - no record returned');
            }

            log.info(`Successfully created login request with hash: ${hash} for user ${user.username}`);

            // Get the login attempt ID if provided
            const loginAttemptId = reqObj.login_attempt_id || '';
            log.info(`Login attempt ID: ${loginAttemptId}`);

            // Generate the login URL with login attempt ID
            const loginUrl = `${config.appLive === '0' ? config.frontendTestUrl : config.frontendUrl}/login?hash=${hash}&t=${Date.now()}&clear=1&attempt=${encodeURIComponent(loginAttemptId)}`;

            responseData.msg = `Successfully created login request for ${user.username}`;
            responseData.data = {
                url: loginUrl,
                username: user.username,
                hash: hash,
                login_attempt_id: loginAttemptId,
                expires_in: '30 minutes'
            };

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to create login request with error:', error);
            responseData.msg = 'Failed to create login request: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },
    approveAllSocial: async (req, res) => {
        let responseData = {};
        let acceptedMedias = ["xUrl", "linkedinUrl", "facebookUrl", "instagramUrl"];

        try {
            const { userIds } = req.body; // Extract user IDs from the request

            if (!Array.isArray(userIds) || userIds.length === 0) {
                throw new Error("User IDs are required.");
            }

            // Fetch token distribution settings once, outside the loop
            const { value, extra } = await settingDbHandler.getOneByQuery({ name: "tokenDistribution" });
            if (!value || !extra) {
                throw new Error("Token distribution settings not found.");
            }

            const levels = extra?.levels;

            // Use Promise.all to process all users concurrently
            const userPromises = userIds.map(async (user_id) => {
                // Validate user_id
                if (!user_id) {
                    throw new Error("User ID is required.");
                }

                // Fetch user data
                const user = await userDbHandler.getById(user_id);
                if (!user) {
                    throw new Error(`User not found: ${user_id}`);
                }

                // Calculate token distribution
                let finVal = value;
                if (user?.extra?.tokens >= 10) {
                    finVal = value / 2;
                }

                // Adjust tokens based on multiple link verifications
                const tokens = parseFloat(finVal) * acceptedMedias.length; // Multiply by the number of links

                // Update user data with income
                await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    {
                        $set: {
                            ["extra.status"]: true,
                        },
                        $inc: {
                            wallet: tokens,
                            "extra.tokens": tokens,
                            "extra.tasksIncome": tokens,
                            "extra.totalIncome": tokens,
                        },
                    }
                );

                // Log income for the user
                await incomeDbHandler.create({
                    user_id: user_id,
                    amount: tokens,
                    extra: { mediaType: "socialMedia" }, // Specify media type for batch approval
                    type: 0,
                    wamt: tokens,
                    iamount: tokens,
                    date: Date.now(),
                });

                // Generate level income
                await levelIncome(user_id, levels, tokens);
            });

            // Wait for all promises to resolve
            await Promise.all(userPromises);

            // Success response for all users
            responseData = {
                msg: "All users approved successfully!",
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            // Error response
            return responseHelper.error(res, { msg: error.message || "An error occurred." });
        }
    },


    approveSocial: async (req, res) => {
        let responseData = {};
        let acceptedMedias = ["xUrl", "linkedinUrl", "facebookUrl", "instagramUrl"]


        try {
            const { user_id } = req.body; // Extract user_id and acceptedMedias from the request

            if (!user_id) {
                throw new Error("User ID is required.");
            }

            if (!Array.isArray(acceptedMedias) || acceptedMedias.length === 0) {
                throw new Error("Invalid or empty acceptedMedias array.");
            }

            // Get the last accepted media type from the array
            let mediaType = acceptedMedias[acceptedMedias.length - 1]?.split(".")[0];
            if (!mediaType) {
                throw new Error("Invalid media type.");
            }

            // Fetch user data
            const user = await userDbHandler.getById(user_id);
            if (!user) {
                throw new Error("User not found.");
            }

            // Fetch token distribution settings
            const { value, extra } = await settingDbHandler.getOneByQuery({ name: "tokenDistribution" });
            if (!value || !extra) {
                throw new Error("Token distribution settings not found.");
            }

            // Calculate token distribution
            let finVal = value;
            if (user?.extra?.tokens >= 10) {
                finVal = value / 2;
            }

            // Adjust tokens based on multiple link verifications
            const tokens = parseFloat(finVal) * acceptedMedias.length; // Multiply by the number of links
            const levels = extra?.levels;

            // Update user data with income
            await userDbHandler.updateOneByQuery(
                { _id: user_id },
                {
                    $set: {
                        ["extra.status"]: true,

                    },
                    $inc: {
                        wallet: tokens,
                        "extra.tokens": tokens,
                        "extra.tasksIncome": tokens,
                        "extra.totalIncome": tokens,
                    },
                }
            );

            // Log income for the user
            await incomeDbHandler.create({
                user_id: user_id,
                amount: tokens,
                extra: { mediaType: mediaType.includes("youtube") ? "youtube" : mediaType },
                type: 0,
                wamt: tokens,
                iamount: tokens,
                date: Date.now(),
            });

            // Generate level income
            await levelIncome(user_id, levels, tokens);

            // Success response
            return responseHelper.success(res, { msg: "Link Verified Successfully!" });
        } catch (error) {
            // Error response
            return responseHelper.error(res, { msg: error.message || "An error occurred." });
        }
    },

    rejectSocial: async (req, res) => {
        try {
            const user_id = req.body.user_id; // Assuming `user_id` comes from the request body

            if (!user_id) {
                throw new Error("User ID is required.");
            }

            // List of media types to reject
            const mediaTypes = ["x", "linkedin", "facebook", "instagram"];

            // Prepare update query to reset all specified media types
            const updateFields = {};
            mediaTypes.forEach((type) => {
                updateFields[`extra.${type}`] = false;
                updateFields[`extra.${type}Url`] = "";
                updateFields[`extra.status`] = false;
                console.log(`extra.${type}`)
            });

            // Update user data
            await userDbHandler.updateOneByQuery(
                { _id: user_id },
                { $set: updateFields },

            );

            // Success response
            return responseHelper.success(res, { msg: "Links Rejected Successfully!" });
        } catch (error) {
            // Error response
            return responseHelper.error(res, { msg: error.message || "An error occurred." });
        }
    },

    add: async (req, res) => {
        let responseData = {};
        // let admin = req.admin;
        // let id = admin.sub;
        let reqObj = req.body;
        try {
            if (reqObj?.email) {
                reqObj.email = reqObj.email.toLowerCase();
            }
            let getByQuery = await adminDbHandler.getByQuery({ email: reqObj.email });
            if (getByQuery.length) {
                responseData.msg = "This email already taken";
                return responseHelper.error(res, responseData);
            }
            let Data = {
                name: reqObj.name,
                email: reqObj.email,
                phone_number: reqObj?.phone_number,
                password: reqObj.password
            }
            await adminDbHandler.create(Data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        let admin = req.admin;
        let id = admin.sub;
        log.info('Recieved request for getAll Admins:', reqObj);
        let responseData = {};
        try {
            let getList = await adminDbHandler.getAll(reqObj, id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = req.params.id;
        try {
            let getAdmin = await adminDbHandler.getById(id, { password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    update: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = req.body.id;
        let reqObj = req.body;
        try {
            if (reqObj?.email) {
                reqObj.email = reqObj.email.toLowerCase();
            }
            let getByQuery = await adminDbHandler.getByQuery({ email: reqObj.email });
            if (getByQuery[0] != undefined && getByQuery[0]._id != id) {
                responseData.msg = "This email is already taken";
                return responseHelper.error(res, responseData);
            }
            let updatedData = {
                name: reqObj.name,
                phone_number: reqObj?.phone_number,
            }

            if (reqObj.email != undefined) {
                updatedData.email = reqObj?.email
            }

            if (reqObj.status !== undefined) {
                updatedData.status = reqObj.status;
            }

            if (reqObj.password) {
                updatedData.password = await _createHashPassword(reqObj.password);
            }
            //}

            let updateAdmin = await adminDbHandler.updateById(id, updatedData);
            responseData.msg = "Data updated successfully!";
            responseData.data = updateAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    }
};