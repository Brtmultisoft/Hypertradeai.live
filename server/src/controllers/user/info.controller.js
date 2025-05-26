'use strict';
const logger = require('../../services/logger');
const log = new logger('userInfoController').getChildLogger();
const { userDbHandler, verificationDbHandler, settingDbHandler, incomeDbHandler, socialLinksDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const { levelIncome, hasUserInvested } = require('./cron.controller');
const { userModel } = require('../../models');
const { getChildLevelsByRefer } = require('../../services/commonFun');

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
/**
 * Method to generate jwt token
 */
let _generateUserToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAuthenticationToken(tokenData);
    return token;
};
/**
 * Method to generate jwt token
 */
let _generateVerificationToken = (tokenData, verification_type) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtVerificationToken(tokenData, verification_type);
    return token;
};
/**
 * Method to update user Email verification Database
 */
let _handleVerificationDataUpdate = async (id) => {
    log.info('Received request for deleting verification token::', id);
    let deletedInfo = await verificationDbHandler.deleteById(id);
    return deletedInfo;
};

let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function (err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) reject(err);
                // override the plain password with the hashed one
                resolve(hash);
            });
        });
    });
};

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

    /**
     * Method to get Dashboard Data
     * This endpoint aggregates all necessary data for the dashboard
     */
    dashboardData: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for Dashboard Data for User:', id);
        let responseData = {};

        try {
            // Get basic user data
            let userData = await userDbHandler.getById(id, { password: 0 });
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Calculate daily profit (trade_booster% of total investment)
            const dailyProfit = userData.total_investment ? userData.total_investment * (userData.trade_booster / 100) : 0;

            // Get income summaries by type
            const incomeTypes = ['daily_profit', 'first_deposit_bonus', 'referral_bonus', 'team_commission', 'level_roi_income', 'active_member_reward'];
            const incomeSummaries = {};

            // Get all income records for this user
            const incomeRecords = await incomeDbHandler.getByQuery({ user_id: id, status: 'credited' });

            // Calculate totals for each income type
            incomeTypes.forEach(type => {
                const typeRecords = incomeRecords.filter(record => record.type === type);
                incomeSummaries[type] = typeRecords.reduce((sum, record) => sum + record.amount, 0);
            });

            // Get direct referrals
            const directReferrals = await userDbHandler.getByQuery({ refer_id: id });
            const directReferralsCount = directReferrals.length;

            // Get active investments count and total
            const { investmentDbHandler } = require('../../services/db');
            const activeInvestments = await investmentDbHandler.getByQuery({
                user_id: id,
                status: { $in: [1, 'active'] }
            });

            const activeInvestmentsCount = activeInvestments.length;
            const activeInvestmentsTotal = activeInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

            // Calculate team size (all levels)
            let teamSize = directReferralsCount;
            let teamInvestment = 0;

            // Count direct referrals' investments
            for (const referral of directReferrals) {
                teamInvestment += referral.total_investment || 0;

                // Get indirect referrals (level 2)
                const indirectReferrals = await userDbHandler.getByQuery({ refer_id: referral._id });
                teamSize += indirectReferrals.length;

                // Count indirect referrals' investments
                for (const indirectReferral of indirectReferrals) {
                    teamInvestment += indirectReferral.total_investment || 0;
                }
            }

            // Calculate total earnings
            const totalEarnings = Object.values(incomeSummaries).reduce((sum, val) => sum + val, 0);

            // Prepare dashboard data
            const dashboardData = {
                ...userData.toJSON(),
                daily_profit: incomeSummaries.daily_profit || dailyProfit,
                first_deposit_bonus: incomeSummaries.first_deposit_bonus || 0,
                referral_bonus: incomeSummaries.referral_bonus || 0,
                team_commission: incomeSummaries.team_commission || 0,
                level_roi_income: incomeSummaries.level_roi_income || 0,
                active_member_reward: incomeSummaries.active_member_reward || 0,
                direct_referrals: directReferralsCount,
                team_size: teamSize,
                team_investment: teamInvestment,
                total_earnings: totalEarnings,
                active_investments_count: activeInvestmentsCount,
                active_investments: activeInvestmentsTotal,
                wallet_balance: userData.wallet || 0,
                topup_wallet_balance: userData.wallet_topup || 0
            };

            responseData.msg = `Dashboard Data Fetched Successfully!`;
            responseData.data = dashboardData;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get dashboard data with error:', error);
            responseData.msg = 'Failed to get dashboard data';
            return responseHelper.error(res, responseData);
        }
    },

    socialMediaVerification: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let url = req.body.link
        try {

            if (!url) throw "Invalid URL!"

            // Matching if the mediaType Exists
            let mediaType = checkMediaExistence(url)
            if (mediaType.length === 0) throw "Invalid URl!"
            mediaType = (mediaType[mediaType.length - 1]).split(".")[0]
            if (!mediaType) throw "Wrong Media Type !!!"

            // Check if the particular media is already true
            const user = await userDbHandler.getById(user_id)
            if (user?.extra[`${mediaType}`] === true) {
                responseData.msg = "Already Verified!";
                return responseHelper.error(res, responseData);
            }

            // Check if its of youtube
            if (mediaType.includes("youtube")) {

                await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    {
                        $set: {
                            [`extra.${mediaType}`]: true
                        }
                    }
                ).then(() => {
                    user.extra[`${mediaType}`] = true
                }).catch(e => { throw `Error while creating income ${e}` })

                if (
                    !user?.extra?.first_youtube ||
                    !user?.extra?.second_youtube ||
                    !user?.extra?.third_youtube ||
                    !user?.extra?.share_first_youtube ||
                    !user?.extra?.share_second_youtube ||
                    !user?.extra?.share_third_youtube
                ) {
                    responseData.msg = `Thanks for ${!mediaType.includes("share") ? "Sharing!" : "Watching!"}`;
                    return responseHelper.success(res, responseData);
                }
            }

            // check if the url is already used!!!
            const ifLinkMatched = await socialLinksDbHandler.getOneByQuery({ url })
            if (ifLinkMatched) {
                responseData.msg = "Outdated Posts Not Allowed!";
                return responseHelper.error(res, responseData);
            }



            if (!mediaType.includes("youtube"))
                await socialLinksDbHandler.create(
                    {
                        user_id,
                        url
                    }
                ).catch(e => { throw `Error while saving the URL log ${e}` })


            await userDbHandler.updateOneByQuery(
                { _id: user_id },
                {
                    $set: {
                        [`extra.${mediaType}`]: true,
                        [`extra.${mediaType}Url`]: url,

                    }
                }
            ).catch(e => { throw `Error while Adding Url ${e}` })



            responseData.msg = "Link Submitted Successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('SOCIAL VERIFICATION, failed to fetch data with error::', error);
            responseData.msg = error;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to get User Profile
     */
    profile: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        // log.info('Recieved request for User Profile for User:', user);
        let responseData = {};
        try {
            // Get basic user data
            let userData = await userDbHandler.getById(id, { password: 0 });

            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Calculate team deposit and team size
            // Get direct referrals
            const directReferrals = await userDbHandler.getByQuery({ refer_id: id });

            // Calculate team deposit (direct + indirect referrals)
            let teamDeposit = 0;
            let teamSize = directReferrals.length;

            // Count direct referrals' investments
            for (const referral of directReferrals) {
                teamDeposit += referral.total_investment || 0;

                // Get indirect referrals (level 2)
                const indirectReferrals = await userDbHandler.getByQuery({ refer_id: referral._id });
                teamSize += indirectReferrals.length;

                // Count indirect referrals' investments
                for (const indirectReferral of indirectReferrals) {
                    teamDeposit += indirectReferral.total_investment || 0;
                }
            }

            // Add team deposit and team size to user data
            const userDataObj = userData.toJSON();
            if (!userDataObj.extra) {
                userDataObj.extra = {};
            }

            userDataObj.extra.teamDeposit = teamDeposit;
            userDataObj.extra.teamSize = teamSize;
            userDataObj.extra.directReferrals = directReferrals.length;

            responseData.msg = `Data Fetched Successfully !`;
            responseData.data = userDataObj;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user with error::', error);
            responseData.msg = 'Failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     *  Method to update Profile
     */
    updateProfile: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(id, { password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user!';
                return responseHelper.error(res, responseData);
            }

            let checkEmail = await userDbHandler.getByQuery({ _id: { $ne: id }, email: reqObj?.email });
            let checkPhoneNumber = await userDbHandler.getByQuery({ _id: { $ne: id }, phone_number: reqObj?.phone_number });

            if (reqObj.phone_number != undefined && checkPhoneNumber.length >= config.phoneCheck) {
                responseData.msg = 'Phone Number Already Exist !';
                return responseHelper.error(res, responseData);
            }
            if (reqObj.email != undefined && checkEmail.length >= config.emailCheck) {
                responseData.msg = 'Email Already Exist !';
                return responseHelper.error(res, responseData);
            }

            let avatar = userData.avatar;
            if (req.file) {
                avatar = req.file.location;
            }
            let updatedObj = {
                name: reqObj?.name,
                address: reqObj?.address,
                dob: reqObj?.dob,
                phone_number: reqObj?.phone_number,
                wallet_address: reqObj?.wallet_address,
                withdraw_wallet: reqObj?.withdraw_wallet,
                country: reqObj?.country,
                country_code: reqObj?.country_code,
                state: reqObj?.state,
                city: reqObj?.city,
                avatar: avatar
            }
            if (config.loginByType != 'email' && reqObj?.email) {
                updatedObj.email = reqObj?.email;
            }
            if (config.loginByType != 'address' && reqObj?.address) {
                updatedObj.address = reqObj?.address;
            }
            await userDbHandler.updateById(id, updatedObj);
            let userUpdatedData = await userDbHandler.getById(id, { password: 0 });
            responseData.data = userUpdatedData;
            responseData.msg = `Data updated sucessfully !`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'Failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle change password
     */
    changePassword: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(id);
            let comparePassword = await _comparePassword(reqObj.old_password, userData.password);
            if (!comparePassword) {
                responseData.msg = `Invalid old password !`;
                return responseHelper.error(res, responseData);
            }
            let compareNewAndOld = await _comparePassword(reqObj.password, userData.password);
            if (compareNewAndOld) {
                responseData.msg = `New password must be different from old password !`;
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                password: await _encryptPassword(reqObj.password)
            }
            await userDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated sucessfully !`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update with error::', error);
            responseData.msg = 'Failed to update data';
            return responseHelper.error(res, responseData);
        }
    },

    logout: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Logout for User:', user);
        let responseData = {};
        try {
            responseData.msg = `Logout Successfully !`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to logout with error::', error);
            responseData.msg = 'Failed to logout user';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to activate daily profit
     */
    activateDailyProfit: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        console.log('User and ID:', user, id);
        log.info('Received request to activate daily profit for User:', id);
        let responseData = {};

        try {
            // Get user data
            const userData = await userDbHandler.getById(id);
            console.log('User data:', userData);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if user is blocked
            if (userData.is_blocked) {
                responseData.msg = 'Your account has been blocked. You cannot activate daily profit.';
                responseData.block_reason = userData.block_reason || 'No reason provided';
                return responseHelper.forbidden(res, responseData);
            }

            // Check if user has made an investment
            const hasInvested = await hasUserInvested(id);
            if (!hasInvested) {
                responseData.msg = 'You need to make an investment before activating daily profit';
                return responseHelper.error(res, responseData);
            }

            // Check if user has already activated daily profit today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get last activation date from either location
            const lastActivationDate = userData.lastDailyProfitActivation ||
                                      (userData.extra && userData.extra.lastDailyProfitActivation);

            if (lastActivationDate) {
                const lastActivation = new Date(lastActivationDate);
                lastActivation.setHours(0, 0, 0, 0);

                if (lastActivation.getTime() === today.getTime()) {
                    responseData.msg = 'Daily profit already activated today';
                    return responseHelper.error(res, responseData);
                }
            }

            // Update user with activation timestamp
            // Use updateOne with upsert to ensure the update happens
            console.log('Updating user with ID:', id);

            // First try with updateById
            try {
                const updateResult = await userDbHandler.updateById(id, {
                    dailyProfitActivated: true,
                    lastDailyProfitActivation: new Date()
                });

                console.log('Update result:', updateResult);

                // If update didn't work, try with direct MongoDB update
                if (!updateResult || !updateResult.dailyProfitActivated) {
                    console.log('First update method failed, trying direct MongoDB update');
                    const directUpdate = await userDbHandler._model.findByIdAndUpdate(
                        id,
                        { $set: { dailyProfitActivated: true, lastDailyProfitActivation: new Date() } },
                        { new: true }
                    );
                    console.log('Direct update result:', directUpdate);
                }
            } catch (updateError) {
                console.error('Error during update:', updateError);
                throw updateError;
            }

            // Verify the update was successful
            const updatedUser = await userDbHandler.getById(id);
            console.log('Updated user data:', updatedUser);

            log.info(`Daily profit activated for user ${id}`);
            responseData.msg = 'Daily profit activated successfully';
            responseData.data = {
                dailyProfitActivated: true,
                user: updatedUser // Include the updated user data in the response
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            console.error('Failed to activate daily profit with error:', error);
            log.error('Failed to activate daily profit with error:', error);
            responseData.msg = 'Failed to activate daily profit: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to check if daily profit is already activated today
     */
    checkDailyProfitStatus: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request to check daily profit status for User:', id);
        let responseData = {};

        try {
            // Get user data
            const userData = await userDbHandler.getById(id);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if user has already activated daily profit today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get last activation date from either location
            const lastActivationDate = userData.lastDailyProfitActivation ||
                                      (userData.extra && userData.extra.lastDailyProfitActivation);

            let isActivatedToday = false;
            if (lastActivationDate) {
                const lastActivation = new Date(lastActivationDate);
                lastActivation.setHours(0, 0, 0, 0);
                isActivatedToday = lastActivation.getTime() === today.getTime();
            }

            responseData.msg = isActivatedToday ? 'Daily profit is activated for today' : 'Daily profit is not activated for today';
            responseData.data = {
                isActivatedToday,
                lastActivationDate
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            console.error('Failed to check daily profit status with error:', error);
            log.error('Failed to check daily profit status with error:', error);
            responseData.msg = 'Failed to check daily profit status: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

};