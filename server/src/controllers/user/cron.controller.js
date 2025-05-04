"use strict";
const logger = require("../../services/logger");
const log = new logger("IncomeController").getChildLogger();
const {
  incomeDbHandler,
  userDbHandler,
  investmentDbHandler,
  settingDbHandler,
  withdrawalDbHandler,
  rankDbHandler,
  teamRewardDbHandler,
  investmentPlanDbHandler,
} = require("../../services/db");
const {
  getTopLevelByRefer,
  getPlacementIdByRefer,
  getPlacementId,
} = require("../../services/commonFun");
const mongoose = require("mongoose");
const cron = require("node-cron");
const config = require("../../config/config");
const { investmentModel } = require("../../models");
const { ethers }  = require('ethers');

const ObjectId = mongoose.Types.ObjectId;
const contractABI = process.env.WITHDRAW_ABI;
const contractAddress = process.env.WITHDRAW_ADDRESS

// Utility function to check if a user has made an investment
const hasUserInvested = async (userId) => {
  console.log('==================== CHECKING IF USER HAS INVESTED ====================');
  console.log('Checking if user has invested, userId:', userId);

  try {
    // First check the user's total_investment field
    const user = await userDbHandler.getById(userId);
    console.log('User found:', user ? 'Yes' : 'No');

    if (user) {
      console.log('User details:');
      console.log('- User ID:', user._id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Total investment:', user.total_investment);
    }

    if (user && user.total_investment > 0) {
      console.log('User has total_investment > 0, returning true');
      console.log('==================== END CHECKING IF USER HAS INVESTED ====================');
      return true;
    }

    console.log('Total investment is 0 or null, checking for active investments');
    // As a fallback, check if the user has any active investments
    // Check for both string 'active' and numeric status 1 (which is also active)
    const investments = await investmentDbHandler.getByQuery({
      user_id: userId,
      status: { $in: ['active', 1] }
    });

    console.log('Investments found:', investments ? investments.length : 0);

    if (investments && investments.length > 0) {
      console.log('Investment details:');
      investments.forEach((inv, index) => {
        console.log(`Investment ${index + 1}:`);
        console.log(`- ID: ${inv._id}`);
        console.log(`- Amount: ${inv.amount}`);
        console.log(`- Status: ${inv.status}`);
        console.log(`- Package type: ${inv.package_type}`);
        console.log(`- Created at: ${inv.created_at}`);
      });
    }

    const result = investments && investments.length > 0;
    console.log('Final result:', result ? 'User has invested' : 'User has not invested');
    console.log('==================== END CHECKING IF USER HAS INVESTED ====================');
    return result;
  } catch (error) {
    console.error(`Error checking if user ${userId} has invested:`, error);
    console.error('Error stack:', error.stack);
    console.log('==================== END CHECKING IF USER HAS INVESTED (ERROR) ====================');
    return false; // Default to false in case of error
  }
};

// Valid slot values for packages
const validSlots = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

const distributeTokens = async () => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
    // Fetch all new users created today
    const newUsers = await userDbHandler.getByQuery({
      created_at: { $gte: startOfDay, $lt: endOfDay },
      status: 1,
    });

    for (const newUser of newUsers) {
      // Fetch previous users created before the new user
      const previousUsers = await userDbHandler.getByQuery({
        created_at: { $lt: newUser.created_at },
        status: 1,
      });
      console.log("previousUsers", previousUsers.length);
      if (previousUsers.length === 0) continue; // Skip if no previous users

      // Calculate total investment made by the new user today
      const investmentsToday = await investmentDbHandler.getByQuery({
        user_id: newUser._id,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: 1,
        type: 0,
      });

      const totalInvestment = investmentsToday.reduce(
        (sum, investment) => sum + investment.amount,
        0
      );

      if (totalInvestment === 0) continue; // Skip if no investment

      // Get the new user's highest package level
      const newUserPackages = await investmentDbHandler.getByQuery({
        user_id: newUser._id,
        status: 1
      });
      const newUserMaxPackage = newUserPackages.length > 0 ?
        Math.max(...newUserPackages.map(inv => inv.slot_value)) : -1;

      const provisionAmount = totalInvestment * 0.4; // 40% of today's investment
      const amountPerUser = provisionAmount / previousUsers.length; // Distribute equally among previous users

      // Distribute to previous users
      for (let prevUser of previousUsers) {
        // Get the previous user's highest package level
        const prevUserPackages = await investmentDbHandler.getByQuery({
          user_id: prevUser._id,
          status: 1
        });
        const prevUserMaxPackage = prevUserPackages.length > 0 ?
          Math.max(...prevUserPackages.map(inv => inv.slot_value)) : -1;

        // Skip if previous user's package level is lower than new user's
        if (prevUserMaxPackage < newUserMaxPackage) continue;

        if (prevUser.extra?.cappingLimit <= 0 || prevUser.extra?.cappingLimit < amountPerUser) {
          continue;
        }
        await userDbHandler.updateByQuery(
          { _id: ObjectId(prevUser._id) },
          {
            $inc: {
              wallet: amountPerUser,
              "extra.provisionIncome": amountPerUser,
              "extra.cappingLimit": -amountPerUser,
            },
          }
        );
        await incomeDbHandler.create({
          user_id: ObjectId(prevUser._id),
          user_id_from: ObjectId(newUser._id),
          type: 2,
          amount: amountPerUser,
          status: 1,
          extra: {
            income_type: "provision",
            fromPackageLevel: newUserMaxPackage
          },
        });
      }
    }

    log.info("Provision distribution completed successfully.");
  } catch (error) {
    log.error("Error in provision distribution", error);
  }
};
const AutoFundDistribution = async (req, res) => {
  try {
    const users = await withdrawalDbHandler.getByQuery({ amount: { $gt: 0 }, status: 0 });
    if (!users || users.length === 0) {
      log.info("No users with Withdraw balance found for auto withdraw.");
      return res
        .status(400)
        .json({ message: "No users eligible for withdraw" });
    }
    const batchSize = 20;
    const totalUsers = users.length;
    let batchStart = 0;
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
    console.log("withdraw");
    const key = await settingDbHandler.getOneByQuery({name:"Keys"});
    console.log(key)
    const wallet = new ethers.Wallet(key.value, provider);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      wallet
    );

    while (batchStart < totalUsers) {
      const batchUsers = users.slice(batchStart, batchStart + batchSize);
      const addressArr = batchUsers.map((user) => `${user.address}`);
      const amountArr = batchUsers.map((user) => `${user.net_amount}`);

      log.info(`Sending batch ${batchStart / batchSize + 1} auto withdraw request:`);
      console.log("BatchUsr" , batchUsers);
      console.log("address", addressArr)
      console.log("amount" , amountArr)
      try {
        const tx = await contract.fundsDistribution(addressArr, amountArr);
        await tx.wait();

        let successAddresses = [];
        for (let i = 0; i < addressArr.length; i++) {
          let address = addressArr[i];
          let net_amount = amountArr[i];

          try {
            let data = await contract.users(address);
            // Compare amounts in Wei
            if (net_amount == data.lastClaimAmount) {
              successAddresses.push(address);
            }
          } catch (error) {
            log.error(`Error fetching details for ${address}:`, error);
          }
        }

        console.log(successAddresses);
        log.info(`Batch ${batchStart / batchSize + 1} auto withdraw successful`);
        log.info("successAddresses", successAddresses);

        for (let user of batchUsers) {
          if (successAddresses.includes(user.address)) {
            const res = await withdrawalDbHandler.updateOneByQuery(
              { _id: ObjectId(user._id) },
              { $set: { status: 1, remark: "SUCCESS" } }
            );
            console.log("Withdrawal status updated:", res);
          }
        }
      } catch (error) {
        log.error(`Batch ${batchStart / batchSize + 1} failed:`, error);
        // Continue with next batch even if current batch fails
      }

      batchStart += batchSize;
    }

    log.info("All batches processed successfully.");
    return res.status(200).json({ message: "All auto withdraw batches completed" });

  } catch (error) {
    log.error("Error during minting request:", error.message);
    return res.status(400).json({ message: "Error during minting" });
  }
};

// Distribute Level Income
const distributeLevelIncome = async (user_id, amount, fromPackageLevel) => {
  try {
    let topLevels = await getTopLevelByRefer(
      user_id,
      config.levelIncomePercentages.length
    );
    for (let i = 0; i < topLevels.length; i++) {
      let levelUser = topLevels[i];
      if (!levelUser) continue;
      console.log("levelUser", levelUser);

      // Check if the user has made an investment
      const hasInvested = await hasUserInvested(levelUser);
      if (!hasInvested) {
        console.log(`User ${levelUser} has not made any investment. Skipping level income.`);
        continue; // Skip to the next user
      }

      const levelUsers = await userDbHandler.getOneByQuery({
        _id: ObjectId(topLevels[i]),
      });

      // Get the user's highest package level using slot_value
      const userPackages = await investmentDbHandler.getByQuery({
        user_id: ObjectId(levelUser),
        status: 1
      });
      const userMaxPackage = userPackages.length > 0 ?
        Math.max(...userPackages.map(inv => inv.slot_value)) : -1;

      // Skip if user's package level is lower than the income source's package level
      if (userMaxPackage < fromPackageLevel) continue;

      let levelAmount = (amount * config.levelIncomePercentages[i]) / 100;
      if (levelUsers.extra.cappingLimit <= 0 || levelUsers.extra.cappingLimit <= levelAmount) {
        continue;
      }
      await userDbHandler.updateOneByQuery(
        { _id: ObjectId(levelUser) },
        {
          $inc: {
            wallet : levelAmount,
            reward: levelAmount,
            "extra.levelIncome": levelAmount,
            "extra.totalIncome": levelAmount,
            "extra.cappingLimit": -levelAmount,
          },
        }
      );

      await incomeDbHandler.create({
        user_id: levelUser,
        user_id_from: user_id,
        amount: levelAmount,
        level: i + 1,
        type: 5,
        remarks: `Level ${i + 1} income ${
          amount * config.levelIncomePercentages[i]
        }%`,
        extra: {
          income_type: "level",
          fromPackageLevel
        },
      });
    }
  } catch (error) {
    log.error("Error in level income distribution", error);
  }
};

// Transfer Remaining to Reward & Achiever Wallet
const transferToRewardWallet = async (amount) => {
  try {
    await userDbHandler.updateOneByQuery(
      { _id: ObjectId(config.rewardWallet) },
      { $inc: { wallet: amount } }
    );

    await incomeDbHandler.create({
      user_id: config.rewardWallet,
      amount: amount,
      type: 4,
      remarks: "Reward & Achiever Wallet Distribution",
    });
  } catch (error) {
    log.error("Error transferring to Reward & Achiever Wallet", error);
  }
};

// Schedule Cron Job to Run Daily at Midnight
// cron.schedule('0 0 * * *', distributeTokens, {
//     scheduled: true,
//     timezone: "UTC"
// });

const distributeTokensHandler = async (req, res) => {
  try {
    await distributeTokens(); // Call the function that handles the distribution
    res
      .status(200)
      .json({ message: "Token distribution triggered successfully" });
  } catch (error) {
    log.error("Error triggering token distribution", error);
    res.status(500).json({ message: "Error triggering token distribution" });
  }
};

const distributeGlobalAutoPoolMatrixIncome = async (user_id, amount, fromPackageLevel) => {
  try {
    // Fetch the new user
    const newUser = await userDbHandler.getById(user_id);
    if (!newUser) throw new Error("User not found");

    // Use the placement_id stored in the newUser object
    let currentPlacementId = newUser.placement_id;
    if (!currentPlacementId) throw new Error("No placement available");

    // Calculate matrix income (10% of the amount)
    const matrixIncome = (amount * 10) / 100;

    // Traverse the placement hierarchy until placement_id becomes null
    while (currentPlacementId) {
      const placementUser = await userDbHandler.getOneByQuery({
        _id: ObjectId(currentPlacementId),
      });
      if (!placementUser) break;

      // Check if the placement user has made an investment
      const hasInvested = await hasUserInvested(currentPlacementId);
      if (!hasInvested) {
        console.log(`Placement user ${placementUser.username || placementUser.email} has not made any investment. Skipping matrix income.`);
        currentPlacementId = placementUser.placement_id;
        continue; // Skip to the next user
      }

      // Get the placement user's highest package level using slot_value
      const userPackages = await investmentDbHandler.getByQuery({
        user_id: ObjectId(currentPlacementId),
        status: 1
      });
      const userMaxPackage = userPackages.length > 0 ?
        Math.max(...userPackages.map(inv => inv.slot_value)) : -1;

      // Skip if user's package level is lower than the income source's package level
      if (userMaxPackage < fromPackageLevel) {
        currentPlacementId = placementUser.placement_id;
        continue;
      }

      console.log("placementUser", placementUser.extra);
      if (placementUser.extra.cappingLimit <= 0 || placementUser.extra.cappingLimit < matrixIncome) {
        currentPlacementId = placementUser.placement_id;
        continue;
      }
      // Distribute matrix income to the placement user
      const auser = await userDbHandler.getById(currentPlacementId);
      await userDbHandler.updateOneByQuery(
        { _id: ObjectId(currentPlacementId) },
        {
          // $inc: {
            wallet: auser.wallet + matrixIncome,
            "extra.matrixIncome": auser.extra.matrixIncome + matrixIncome,
            "extra.cappingLimit": auser.extra.cappingLimit - matrixIncome,
          // },
        }
      );

      await incomeDbHandler.create({
        user_id: ObjectId(currentPlacementId),
        user_id_from: ObjectId(user_id),
        amount: matrixIncome,
        type: 6,
        status: 1,
        extra: {
          income_type: "matrix",
          fromPackageLevel
        },
      });

      // Move to the next placement user
      currentPlacementId = placementUser.placement_id;
    }

    return true;
  } catch (error) {
    log.error("Error in matrix income distribution:", error);
    throw error;
  }
};

// Process team commissions (Level ROI Income) for MLM business plan
const processTeamCommission = async (user_id, amount) => {
  try {
    console.log('\n======== PROCESSING LEVEL ROI INCOME ========');
    console.log(`Processing level ROI income for user ID: ${user_id}, amount: $${amount}`);

    // Fixed percentages as per the plan - now extended to 10 levels
    const percentages = {
      level1: 25, // 25% of ROI income for level 1
      level2: 10, // 10% of ROI income for level 2
      level3: 5,  // 5% of ROI income for level 3
      level4: 4,  // 4% of ROI income for level 4
      level5: 3,  // 3% of ROI income for level 5
      level6: 2,  // 2% of ROI income for level 6
      level7: 1,  // 1% of ROI income for level 7
      level8: 0.5,  // 1% of ROI income for level 8
      level9: 0.5,  // 1% of ROI income for level 9
      level10: 0.5  // 1% of ROI income for level 10
    };

    console.log(`Level ROI Income percentages:
      Level 1: ${percentages.level1}%,
      Level 2: ${percentages.level2}%,
      Level 3: ${percentages.level3}%,
      Level 4: ${percentages.level4}%,
      Level 5: ${percentages.level5}%,
      Level 6: ${percentages.level6}%,
      Level 7: ${percentages.level7}%,
      Level 8: ${percentages.level8}%,
      Level 9: ${percentages.level9}%,
      Level 10: ${percentages.level10}%`);

    // Get the user who made the investment
    const investmentUser = await userDbHandler.getById(user_id);
    if (!investmentUser) {
      console.error(`User not found for ID: ${user_id}`);
      return false;
    }
    console.log(`Investment user: ${investmentUser.username || investmentUser.email} (ID: ${investmentUser._id})`);
    console.log(`Investment user's refer_id: ${investmentUser.refer_id}`);

    // Start with the user's referrer (level 1)
    let currentUser = await userDbHandler.getById(investmentUser.refer_id);
    let level = 1;

    // Process up to 10 levels as per the updated plan
    const maxLevel = 10;
    console.log(`Processing up to ${maxLevel} levels of ROI income`);

    while (currentUser && level <= maxLevel) {
      console.log(`\n--- LEVEL ${level} COMMISSION ---`);
      console.log(`Current upline user: ${currentUser.username || currentUser.email} (ID: ${currentUser._id})`);
      console.log(`Current upline user's refer_id: ${currentUser.refer_id}`);

      // Check if the upline user has made an investment
      const hasInvested = await hasUserInvested(currentUser._id);
      if (!hasInvested) {
        console.log(`Upline user ${currentUser.username || currentUser.email} has not made any investment. Skipping commission.`);

        // Move to the next level (upline)
        if (currentUser.refer_id) {
          // Check if refer_id is a string 'admin' - this is a special case
          if (currentUser.refer_id === 'admin') {
            console.log(`Found special 'admin' refer_id. Looking up admin user...`);
            // Try to find the admin user with ID 678f9a82a2dac325900fc47e
            const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" });
            if (adminUser) {
              console.log(`Found admin user: ${adminUser.username || adminUser.email} (ID: ${adminUser._id})`);
              currentUser = adminUser;
            } else {
              console.log(`Admin user not found. Breaking out of loop.`);
              break;
            }
          } else {
            // Normal case - refer_id is an ObjectId
            const nextUser = await userDbHandler.getById(currentUser.refer_id);
            console.log(`Moving to next level. Next upline user: ${nextUser ? (nextUser.username || nextUser.email) : 'None'} (ID: ${nextUser?._id})`);
            if (nextUser) {
              currentUser = nextUser;
            } else {
              console.log(`Next upline user not found. Breaking out of loop.`);
              break;
            }
          }
        } else {
          console.log(`No more upline users. Breaking out of loop.`);
          break;
        }
        level++;
        continue; // Skip to the next iteration
      }

      // Check if the user has direct referrals (required for level ROI income)
      const directReferrals = await userDbHandler.getByQuery({ refer_id: currentUser._id });
      console.log(`Current upline user has ${directReferrals.length} direct referrals`);

      // NEW REQUIREMENT: User can only receive level ROI up to the level that matches their direct referral count
      // For example, if user has 3 direct referrals, they can receive ROI from levels 1, 2, and 3 only
      console.log(`Level ROI income level ${level} requires at least ${level} direct referrals`);

      // Check if user has enough direct referrals for this level
      if (directReferrals.length >= level && hasInvested) {
        console.log(`User has enough direct referrals (${directReferrals.length} >= ${level}) and has invested. Processing commission...`);

        // Calculate daily profit from the investment amount using fixed 8% ROI
        const roiRate = 8/30; // Fixed 8% ROI as per requirements
        console.log(`Using fixed ROI rate: ${roiRate}%`);

        // Calculate daily income generated from the investment
        const dailyIncome = (amount * roiRate) / 100;
        console.log(`Daily ROI: $${dailyIncome.toFixed(2)} (${roiRate}% of $${amount})`);

        // Calculate commission amount based on level and daily income
        const commissionPercentage = percentages[`level${level}`];
        const commissionAmount = (dailyIncome * commissionPercentage) / 100;
        console.log(`Commission percentage: ${commissionPercentage}%`);
        console.log(`Commission amount: $${commissionAmount.toFixed(4)} (${commissionPercentage}% of $${dailyIncome.toFixed(2)})`);

        // Process commission
        try {
          // Add commission to user's wallet
          const auser = await userDbHandler.getById(currentUser._id);
          const walletUpdate = await userDbHandler.updateOneByQuery({_id: currentUser._id}, {
            $inc: {
              wallet: commissionAmount,
              "extra.teamCommission": commissionAmount
            }
          });
          console.log(`Wallet update result: ${walletUpdate ? 'Success' : 'Failed'}`);

          // Create income record
          const incomeRecord = await incomeDbHandler.create({
            user_id: ObjectId(currentUser._id),
            user_id_from: ObjectId(user_id),
            type: 'level_roi_income',
            amount: commissionAmount,
            status: 'credited',
            level: level,
            description: `Level ${level} ROI Income`,
            extra: {
              fromUser: investmentUser.username || investmentUser.email,
              investmentAmount: amount,
              dailyIncome: dailyIncome,
              commissionPercentage: commissionPercentage
            }
          });
          console.log(`Income record created: ${incomeRecord ? 'Success' : 'Failed'} (ID: ${incomeRecord?._id})`);
        } catch (updateError) {
          console.error(`Error updating wallet or creating income record: ${updateError.message}`);
        }
      } else {
        if (!hasInvested) {
          console.log(`User ${currentUser.username || currentUser.email} has not invested. Skipping commission.`);
        } else if (directReferrals.length < level) {
          console.log(`User ${currentUser.username || currentUser.email} does not have enough direct referrals (${directReferrals.length} < ${level}) for level ${level} ROI. Skipping commission.`);
        }
      }

      // Move to the next level (upline)
      if (currentUser.refer_id) {
        // Check if refer_id is a string 'admin' - this is a special case
        if (currentUser.refer_id === 'admin') {
          console.log(`Found special 'admin' refer_id. Looking up admin user...`);
          // Try to find the admin user with ID 678f9a82a2dac325900fc47e
          const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" });
          if (adminUser) {
            console.log(`Found admin user: ${adminUser.username || adminUser.email} (ID: ${adminUser._id})`);
            currentUser = adminUser;
          } else {
            console.log(`Admin user not found. Breaking out of loop.`);
            break;
          }
        } else {
          // Normal case - refer_id is an ObjectId
          const nextUser = await userDbHandler.getById(currentUser.refer_id);
          console.log(`Moving to next level. Next upline user: ${nextUser ? (nextUser.username || nextUser.email) : 'None'} (ID: ${nextUser?._id})`);
          if (nextUser) {
            currentUser = nextUser;
          } else {
            console.log(`Next upline user not found. Breaking out of loop.`);
            break;
          }
        }
      } else {
        console.log(`No more upline users. Breaking out of loop.`);
        break;
      }
      level++;
    }

    console.log('======== LEVEL ROI INCOME PROCESSING COMPLETE ========\n');
    return true;
  } catch (error) {
    console.error('Error processing team commission:', error);
    return false;
  }
};

// Process user ranks based on trade balance and active team
const _processUserRanks = async () => {
  try {
    console.log('\n======== PROCESSING USER RANKS ========');

    // Get all ranks ordered by min_trade_balance (highest to lowest)
    const ranks = await rankDbHandler.getByQuery({}, {}).sort({ min_trade_balance: -1 });
    console.log(`Found ${ranks.length} ranks in the database:`);
    ranks.forEach(rank => {
      console.log(`- ${rank.name}: Min Investment $${rank.min_trade_balance}, Team Size ${rank.active_team}, Trade Booster ${rank.trade_booster}%`);
    });

    // Get all users
    const users = await userDbHandler.getByQuery({});
    console.log(`Processing ranks for ${users.length} users`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const user of users) {
      console.log(`\n--- PROCESSING USER: ${user.username || user.email} ---`);

      // Get user's direct referrals
      const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });

      // Filter to only include active direct referrals (those who have invested)
      const activeDirectReferrals = directReferrals.filter(ref => ref.total_investment > 0);
      const activeTeamCount = activeDirectReferrals.length;

      console.log(`User details:`);
      console.log(`- ID: ${user._id}`);
      console.log(`- Total investment: $${user.total_investment}`);
      console.log(`- Total direct referrals: ${directReferrals.length}`);
      console.log(`- Active direct referrals: ${activeTeamCount}`);
      console.log(`- Current rank: ${user.rank}`);
      console.log(`- Current trade booster: ${user.trade_booster}%`);
      console.log(`- Current level ROI income: ${user.level_roi_income}`);
      console.log(`- Current daily limit view: ${user.daily_limit_view}`);

      if (directReferrals.length > 0) {
        console.log(`Direct referrals (active ones have investments > $0):`);
        directReferrals.forEach((ref, index) => {
          const isActive = ref.total_investment > 0;
          console.log(`  ${index + 1}. ${ref.username || ref.email} (Investment: $${ref.total_investment}) - ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        });
      }

      // Find the highest rank the user qualifies for based on investment and team size
      // Start from highest rank and work down
      let newRank = 'ACTIVE'; // Default rank
      let qualifiedRank = null;

      console.log(`\nChecking rank qualifications:`);

      // Always use hardcoded ranks to ensure consistency
      console.log('Using hardcoded ranks for reliable rank calculation');
      const sortedRanks = [
        {
          name: 'SUPREME',
          min_trade_balance: 20000,
          active_team: 60,
          daily_limit_view: 5,
          trade_booster: 4.5,
          level_roi_income: 5
        },
        {
          name: 'ROYAL',
          min_trade_balance: 5000,
          active_team: 22,
          daily_limit_view: 4,
          trade_booster: 4.0,
          level_roi_income: 3
        },
        {
          name: 'VETERAM',
          min_trade_balance: 2000,
          active_team: 11,
          daily_limit_view: 3,
          trade_booster: 3.5,
          level_roi_income: 2
        },
        {
          name: 'PRIME',
          min_trade_balance: 500,
          active_team: 5,
          daily_limit_view: 2,
          trade_booster: 3.0,
          level_roi_income: 1
        },
        {
          name: 'ACTIVE',
          min_trade_balance: 50,
          active_team: 0,
          daily_limit_view: 1,
          trade_booster: 2.5,
          level_roi_income: 0
        }
      ];

      // Log each rank for debugging
      console.log(`Using ${sortedRanks.length} hardcoded ranks:`);
      sortedRanks.forEach(rank => {
        console.log(`Rank: ${rank.name}, Min Trade Balance: $${rank.min_trade_balance}, Active Team: ${rank.active_team}, Trade Booster: ${rank.trade_booster}%`);
      });

      // Loop through ranks from highest to lowest
      for (const rank of sortedRanks) {
        console.log(`- ${rank.name}: `);
        console.log(`  Required investment: $${rank.min_trade_balance} (User has: $${user.total_investment}) - ${user.total_investment >= rank.min_trade_balance ? 'PASS' : 'FAIL'}`);
        console.log(`  Required team size: ${rank.active_team} (User has: ${activeTeamCount}) - ${activeTeamCount >= rank.active_team ? 'PASS' : 'FAIL'}`);

        // Check if user meets the investment and team size requirements
        if (user.total_investment >= rank.min_trade_balance && activeTeamCount >= rank.active_team) {
          qualifiedRank = rank;
          newRank = rank.name;
          console.log(`  RESULT: User qualifies for rank ${newRank}`);
          break; // Found the highest rank, exit loop
        } else {
          console.log(`  RESULT: User does not qualify for rank ${rank.name}`);
        }
      }

      // If no rank was found, use ACTIVE as default
      if (!qualifiedRank) {
        console.log(`User does not qualify for any rank, using default: ACTIVE`);
        qualifiedRank = await rankDbHandler.getOneByQuery({ name: 'ACTIVE' });
      }

      // Enhanced debugging for all users
      console.log(`\n*** DETAILED RANK QUALIFICATION INFO ***`);
      console.log(`Email: ${user.email}`);
      console.log(`ID: ${user._id}`);
      console.log(`Total investment: $${user.total_investment}`);
      console.log(`Direct referrals: ${activeTeamCount}`);
      console.log(`Current rank: ${user.rank}`);
      console.log(`Qualified for rank: ${newRank}`);
      console.log(`Qualified rank details: ${qualifiedRank ? JSON.stringify(qualifiedRank) : 'None'}`);

      // Always check if user meets requirements for any rank, regardless of current rank
      // This ensures we update users who qualify for higher ranks
      const shouldUpdate = true; // Always evaluate rank updates

      if (shouldUpdate) {
        // Get the rank details directly from the hardcoded ranks
        console.log(`Getting rank details for ${newRank} from hardcoded ranks`);
        let rankDetails = sortedRanks.find(rank => rank.name === newRank);

        if (!rankDetails) {
          console.log(`ERROR: Rank details not found for ${newRank} in hardcoded ranks, using ACTIVE as fallback`);
          rankDetails = {
            name: 'ACTIVE',
            min_trade_balance: 50,
            active_team: 0,
            daily_limit_view: 1,
            trade_booster: 2.5,
            level_roi_income: 0
          };
        }

        console.log(`Using rank details for ${newRank}:`, rankDetails);

        console.log(`\nUpdating user ${user.username || user.email}:`);
        console.log(`- From rank: ${user.rank} to ${newRank}`);
        console.log(`- From trade booster: ${user.trade_booster}% to ${rankDetails.trade_booster}%`);
        console.log(`- From level ROI income: ${user.level_roi_income} to ${rankDetails.level_roi_income}`);
        console.log(`- From daily limit view: ${user.daily_limit_view} to ${rankDetails.daily_limit_view}`);

        // Use direct MongoDB update to ensure it works
        try {
          // First try with updateById
          const updateResult = await userDbHandler.updateByQuery({_id: user._id}, {
            rank: newRank,
            trade_booster: rankDetails.trade_booster,
            level_roi_income: rankDetails.level_roi_income,
            daily_limit_view: rankDetails.daily_limit_view,
            rank_benefits_active: true // Ensure rank benefits are active
          });

          console.log(`Update result: ${updateResult ? 'Success' : 'Failed'}`);

          // If update didn't work, try with direct MongoDB update
          if (!updateResult) {
            console.log('First update method failed, trying direct MongoDB update');
            const mongoose = require('mongoose');
            const User = mongoose.model('Users');

            const directUpdate = await User.findByIdAndUpdate(
              user._id,
              {
                $set: {
                  rank: newRank,
                  trade_booster: rankDetails.trade_booster,
                  level_roi_income: rankDetails.level_roi_income,
                  daily_limit_view: rankDetails.daily_limit_view,
                  rank_benefits_active: true
                }
              },
              { new: true }
            );

            console.log('Direct update result:', directUpdate ? 'Success' : 'Failed');
            if (directUpdate) {
              console.log(`Updated user rank to ${directUpdate.rank} with trade booster ${directUpdate.trade_booster}%`);
            }
          }

          updatedCount++;
        } catch (updateError) {
          console.error('Error during update:', updateError);
        }
      } else {
        console.log(`No rank change needed for user ${user.username || user.email}`);
        unchangedCount++;
      }
    }

    console.log(`\n======== USER RANK PROCESSING COMPLETE ========`);
    console.log(`Updated ${updatedCount} users, ${unchangedCount} users unchanged`);

    return { success: true, message: 'User ranks updated successfully', updatedCount, unchangedCount };
  } catch (error) {
    console.error('Failed to update user ranks with error::', error);
    return { success: false, message: 'Failed to update user ranks', error };
  }
};

// API endpoint for processing user ranks
const processUserRanks = async (req, res) => {
  try {
    console.log("Processing user ranks...");
    console.log("Request body:", req.body);

    // Check if API key is provided and valid
    if (!req.body.key) {
      console.error("API key not provided in request body");
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      console.error("Invalid API key provided");
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    // console.log("API key validated successfully");
    const result = await _processUserRanks();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'User ranks processed successfully',
        updatedCount: result.updatedCount,
        unchangedCount: result.unchangedCount
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process user ranks',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in user ranks API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing user ranks',
      error: error.message
    });
  }
};

// Process team rewards based on team deposit and time period
const _processTeamRewards = async () => {
  try {
    // Team reward tiers
    const teamRewardTiers = [
      { team_deposit: 100000, time_period: 30, reward_amount: 15000 },
      { team_deposit: 300000, time_period: 60, reward_amount: 50000 },
      { team_deposit: 1200000, time_period: 90, reward_amount: 500000 }
    ];

    // Get all users
    const users = await userDbHandler.getByQuery({});
    console.log(`Processing team rewards for ${users.length} users`);

    for (const user of users) {
      console.log(`\n--- PROCESSING USER: ${user.username || user.email} (ID: ${user._id}) ---`);

      // Get user's team (all referrals in their downline)
      const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });
      console.log(`User has ${directReferrals.length} direct referrals`);

      // Filter to only include active direct referrals (those who have invested)
      const activeDirectReferrals = directReferrals.filter(ref => ref.total_investment > 0);
      console.log(`User has ${activeDirectReferrals.length} ACTIVE direct referrals (with investments)`);

      if (activeDirectReferrals.length > 0) {
        console.log(`Active direct referrals:`);
        activeDirectReferrals.forEach((ref, index) => {
          console.log(`  ${index + 1}. ${ref.username || ref.email} (Investment: $${ref.total_investment})`);
        });
      }

      // Calculate total team deposit
      let totalTeamDeposit = 0;
      let activeTeamDeposit = 0;

      // Count direct referrals' investments
      for (const referral of directReferrals) {
        totalTeamDeposit += referral.total_investment;
        if (referral.total_investment > 0) {
          activeTeamDeposit += referral.total_investment;
        }

        // Get indirect referrals (level 2)
        const indirectReferrals = await userDbHandler.getByQuery({ refer_id: referral._id });
        console.log(`Direct referral ${referral.username || referral.email} has ${indirectReferrals.length} indirect referrals`);

        // Filter to only include active indirect referrals
        const activeIndirectReferrals = indirectReferrals.filter(ref => ref.total_investment > 0);

        // Count indirect referrals' investments
        for (const indirectReferral of indirectReferrals) {
          totalTeamDeposit += indirectReferral.total_investment;
          if (indirectReferral.total_investment > 0) {
            activeTeamDeposit += indirectReferral.total_investment;
          }
        }
      }

      console.log(`Total team deposit: $${totalTeamDeposit}`);
      console.log(`Active team deposit: $${activeTeamDeposit}`);

      // Check if user qualifies for any team reward
      console.log(`\nChecking team reward qualification:`);
      console.log(`Team reward tiers:`);
      teamRewardTiers.forEach((tier, index) => {
        console.log(`Tier ${index + 1}: $${tier.team_deposit} team deposit → $${tier.reward_amount} reward after ${tier.time_period} days`);
      });

      // Use active team deposit for qualification
      const depositToUse = activeTeamDeposit;
      console.log(`Using active team deposit ($${depositToUse}) for qualification`);

      for (const tier of teamRewardTiers) {
        console.log(`\nChecking tier: $${tier.team_deposit} team deposit requirement`);
        console.log(`User's active team deposit: $${depositToUse}`);
        console.log(`Qualification status: ${depositToUse >= tier.team_deposit ? 'QUALIFIED' : 'NOT QUALIFIED'}`);

        if (depositToUse >= tier.team_deposit) {
          console.log(`User qualifies for $${tier.reward_amount} reward after ${tier.time_period} days`);

          // Check if user already has an active team reward of this tier
          const existingReward = await teamRewardDbHandler.getOneByQuery({
            user_id: user._id,
            team_deposit: tier.team_deposit,
            status: { $in: ['pending', 'completed'] }
          });

          console.log(`User already has this reward: ${existingReward ? 'YES' : 'NO'}`);

          if (!existingReward) {
            console.log(`Creating new team reward for user`);

            // Create new team reward
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + tier.time_period);
            console.log(`Reward start date: ${new Date().toISOString()}`);
            console.log(`Reward end date: ${endDate.toISOString()}`);

            const newReward = {
              user_id: user._id,
              team_deposit: tier.team_deposit,
              time_period: tier.time_period,
              reward_amount: tier.reward_amount,
              start_date: new Date(),
              end_date: endDate,
              status: 'pending',
              remarks: `Team deposit of $${tier.team_deposit} achieved. Reward will be processed after ${tier.time_period} days.`
            };

            try {
              const createdReward = await teamRewardDbHandler.create(newReward);
              console.log(`Team reward created successfully: ${createdReward ? 'YES' : 'NO'}`);
              if (createdReward) {
                console.log(`Reward ID: ${createdReward._id}`);
              }
              log.info(`Created new team reward for user ${user.username || user.email}`);
            } catch (rewardError) {
              console.error(`Error creating team reward: ${rewardError.message}`);
            }
          } else {
            console.log(`Skipping reward creation - user already has an active reward of this tier`);
            console.log(`Existing reward status: ${existingReward.status}`);
            console.log(`Existing reward end date: ${existingReward.end_date}`);
          }
        } else {
          console.log(`User does not qualify for this tier`);
        }
      }
    }

    // Process completed team rewards
    const pendingRewards = await teamRewardDbHandler.getByQuery({
      status: 'pending',
      end_date: { $lte: new Date() }
    });

    for (const reward of pendingRewards) {
      // Create income entry for the reward
      const hasInvested = await hasUserInvested(reward.user_id);
      if(hasInvested) {
        // Get user info
        const user = await userDbHandler.getById(reward.user_id);

        const incomeData = {
          user_id: reward.user_id,
          type: 'team_reward',
          amount: reward.reward_amount,
          status: 'credited',
          description: `Team reward for maintaining $${reward.team_deposit} team deposit for ${reward.time_period} days`,
          extra: {
            team_deposit: reward.team_deposit,
            time_period: reward.time_period
          }
        };

        await incomeDbHandler.create(incomeData);

        // Update user's wallet
        await userDbHandler.updateByQuery({_id: reward.user_id}, {
          $inc: {
            wallet: reward.reward_amount
          }
        });

        // Update reward status
        await teamRewardDbHandler.updateById(reward._id, {
          status: 'completed',
          remarks: `Reward of $${reward.reward_amount} credited to wallet`
        });

        log.info(`Processed team reward for user ${user ? (user.username || user.email) : reward.user_id}`);
      }
    }

    return { success: true, message: 'Team rewards processed successfully' };
  } catch (error) {
    log.error('Failed to process team rewards with error::', error);
    return { success: false, message: 'Failed to process team rewards', error };
  }
};

// Process active member rewards
const _processActiveMemberReward = async () => {
  try {
    // Get the investment plan to access active member reward data
    const plans = await investmentPlanDbHandler.getAll({});
    if (!plans || plans.length === 0) {
      log.error('No investment plans found for active member rewards');
      return;
    }
    const plan = plans[0];

    // console.log(`Found investment plan: ${plan.title}`);

    // Check if plan has active_member_rewards
    if (!plan.active_member_rewards) {
      // console.log('No active_member_rewards field in the investment plan');
      return;
    }

    if (!Array.isArray(plan.active_member_rewards)) {
      // console.log(`active_member_rewards is not an array: ${typeof plan.active_member_rewards}`);
      return;
    }

    // console.log(`Plan has ${plan.active_member_rewards.length} active member reward levels:`);
    // plan.active_member_rewards.forEach((level, index) => {
    //   console.log(`Level ${index + 1}: ${level.direct} direct referrals, ${level.team} team size, $${level.reward} reward`);
    // });

    // Get all users directly using mongoose
    let users = [];
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('Users');
      users = await User.find({});

      // console.log(`Found ${users.length} users using direct mongoose query`);

      // Continue with processing if we have users
      if (!users || users.length === 0) {
        // console.log('No users found in the database');
        return;
      }
    } catch (userQueryError) {
      // console.error('Error querying users:', userQueryError);
      return;
    }

    // console.log(`Processing active member rewards for ${users.length} users`);

    for (const user of users) {
      // console.log(`\nProcessing user: ${user.username || user.email} (ID: ${user._id})`);

      // Count direct referrals using mongoose directly
      const User = mongoose.model('Users');
      const directReferrals = await User.find({ refer_id: user._id });
      const directCount = directReferrals.length;
      // console.log(`Direct referrals: ${directCount}`);
      if (directCount > 0) {
        console.log(`Direct referral emails: ${directReferrals.map(u => u.email).join(', ')}`);
      }

      // Count total team size (all levels)
      let teamSize = 0;
      const countTeamMembers = async (referrerId) => {
        const User = mongoose.model('Users');
        const referrals = await User.find({ refer_id: referrerId });
        teamSize += referrals.length;

        // Process next level recursively
        for (const referral of referrals) {
          await countTeamMembers(referral._id);
        }
      };

      await countTeamMembers(user._id);
      // console.log(`Total team size: ${teamSize}`);

      // Check if plan has active_member_rewards
      if (!plan.active_member_rewards || !Array.isArray(plan.active_member_rewards)) {
        console.log('No active_member_rewards found in the investment plan');
        continue;
      }

      // console.log(`Checking ${plan.active_member_rewards.length} reward levels...`);

      // Check if user qualifies for any reward level
      // Check if the user has made an investment
      const hasInvested = await hasUserInvested(user._id);
      if (!hasInvested) {
        console.log(`User ${user.username || user.email} has not made any investment. Skipping active member reward.`);
        continue; // Skip to the next user
      }

      for (const rewardLevel of plan.active_member_rewards) {
        // console.log(`Checking reward level: ${rewardLevel.direct} direct, ${rewardLevel.team} team, $${rewardLevel.reward} reward`);

        // TEMPORARY TEST CODE: Lower thresholds for testing
        const testDirect = 2; // Temporarily set to 2 instead of rewardLevel.direct
        const testTeam = 7;   // Temporarily set to 7 instead of rewardLevel.team

        // console.log(`Using test thresholds: ${testDirect} direct, ${testTeam} team (original: ${rewardLevel.direct} direct, ${rewardLevel.team} team)`);

        if (directCount >= testDirect && teamSize >= testTeam) {
          // console.log(`User qualifies for reward level: ${rewardLevel.direct} direct, ${rewardLevel.team} team, $${rewardLevel.reward} reward`);

          // Check if user already received this reward using mongoose directly
          const Income = mongoose.model('Incomes');
          const existingReward = await Income.findOne({
            user_id: user._id,
            type: 'active_member_reward',
            'extra.directRequired': rewardLevel.direct,
            'extra.teamRequired': rewardLevel.team
          });

          // console.log(`Checking if user already received this reward: ${existingReward ? 'Yes' : 'No'}`);

          if (!existingReward) {
            // console.log(`Creating new active member reward of $${rewardLevel.reward} for user ${user.username || user.email}`);

            try {
              // Create reward income record using mongoose directly
              const newIncome = new Income({
                user_id: mongoose.Types.ObjectId(user._id),
                type: 'active_member_reward',
                amount: rewardLevel.reward,
                status: 'credited',
                description: 'Active member reward',
                extra: {
                  directReferrals: directCount,
                  teamSize: teamSize,
                  directRequired: rewardLevel.direct,
                  teamRequired: rewardLevel.team
                }
              });

              await newIncome.save();
              // console.log(`Income record created with ID: ${newIncome._id}`);

              // Add reward to user's wallet using mongoose directly
              const walletUpdate = await User.findByIdAndUpdate(
                user._id,
                {
                  $inc: {
                    wallet: rewardLevel.reward,
                    "extra.activeMemberReward": rewardLevel.reward
                  }
                },
                { new: true }
              );

              console.log(`Wallet updated. New balance: $${walletUpdate.wallet}`);
            } catch (rewardError) {
              console.error(`Error creating reward: ${rewardError.message}`);
            }

            // Only give the highest reward level the user qualifies for
            break;
          }
        }
      }
    }

    return true;
  } catch (error) {
    log.error('Error processing active member rewards:', error);
    return false;
  }
};

// API endpoint for processing active member rewards
const processActiveMemberReward = async (req, res) => {
  try {
    console.log("Processing active member rewards...");
    const result = await _processActiveMemberReward();

    if (result) {
      return res.status(200).json({
        status: true,
        message: 'Active member rewards processed successfully'
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process active member rewards'
      });
    }
  } catch (error) {
    console.error('Error in active member rewards API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing active member rewards',
      error: error.message
    });
  }
};

// Process Level ROI Income (Team Commission) for all users
const _processLevelRoiIncome = async () => {
  try {
    console.log('\n======== PROCESSING LEVEL ROI INCOME FOR ALL USERS ========');

    // Get all users with active investments
    const usersWithInvestments = await userDbHandler.getByQuery({ total_investment: { $gt: 0 } });

    console.log(`Found ${usersWithInvestments.length} users with investments`);
    let processedCount = 0;
    let totalCommission = 0;

    for (const user of usersWithInvestments) {
      console.log(`\nProcessing level ROI income for user: ${user.username || user.email} (ID: ${user._id})`);
      console.log(`User's total investment: $${user.total_investment}`);

      // Check if user has activated daily profit for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get last activation date
      const lastActivationDate = user.lastDailyProfitActivation ||
                                (user.extra && user.extra.lastDailyProfitActivation);

      if (!lastActivationDate) {
        console.log(`User ${user._id} has not activated daily profit yet. Skipping level ROI income...`);
        continue;
      }

      const lastActivation = new Date(lastActivationDate);
      lastActivation.setHours(0, 0, 0, 0);

      if (lastActivation.getTime() !== today.getTime()) {
        console.log(`User ${user._id} has not activated daily profit today. Last activation: ${lastActivation.toISOString()}. Skipping level ROI income...`);
        continue;
      }

      console.log(`User ${user._id} has activated daily profit today. Processing level ROI income...`);

      try {
        // Process team commissions for this user's total investment
        const teamCommissionResult = await processTeamCommission(user._id, user.total_investment);
        console.log(`Level ROI income processing result: ${teamCommissionResult ? 'Success' : 'Failed'}`);

        if (teamCommissionResult) {
          processedCount++;
        }
      } catch (commissionError) {
        console.error(`Error processing level ROI income for user ${user._id}: ${commissionError.message}`);
      }
    }

    console.log('======== LEVEL ROI INCOME PROCESSING COMPLETE ========\n');
    return {
      success: true,
      processedCount,
      totalCommission
    };
  } catch (error) {
    console.error('Error processing level ROI income:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process daily trading profit
const _processDailyTradingProfit = async () => {
  try {
    // Get all active investments
    const activeInvestments = await investmentDbHandler.getByQuery({ status: 'active' });

    console.log(`Processing daily profit for ${activeInvestments.length} active investments`);
    let processedCount = 0;
    let totalProfit = 0;

    for (const investment of activeInvestments) {
      // Calculate days since last profit distribution
      const lastProfitDate = new Date(investment.last_profit_date || investment.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - lastProfitDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      console.log(`Investment ID: ${investment._id}, Last profit date: ${lastProfitDate}, Days since last profit: ${diffDays}`);

      if (diffDays >= 1) {
        // Get user information
        const user = await userDbHandler.getById(investment.user_id);
        if (!user) {
          console.error(`User not found for investment ${investment._id}. Skipping...`);
          continue;
        }

        // Check if user has activated daily profit for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get last activation date
        const lastActivationDate = user.lastDailyProfitActivation ||
                                  (user.extra && user.extra.lastDailyProfitActivation);

        if (!lastActivationDate) {
          console.log(`User ${user._id} has not activated daily profit yet. Skipping...`);
          continue;
        }

        const lastActivation = new Date(lastActivationDate);
        lastActivation.setHours(0, 0, 0, 0);

        if (lastActivation.getTime() !== today.getTime()) {
          console.log(`User ${user._id} has not activated daily profit today. Last activation: ${lastActivation.toISOString()}. Skipping...`);
          continue;
        }

        console.log(`User ${user._id} has activated daily profit today. Processing ROI...`);

        // Calculate daily profit using fixed 8/30% ROI rate (8% monthly distributed daily)
        const roiRate = 8/30; // Fixed 8/30% ROI rate as per requirements
        const dailyProfit = (investment.amount * roiRate) / 100;
        totalProfit += dailyProfit;

        console.log(`Processing profit for investment ${investment._id}: $${dailyProfit} (${roiRate}% of $${investment.amount})`);

        try {
          // Add profit to user's wallet
          const walletUpdate = await userDbHandler.updateOneByQuery({_id : investment.user_id}, {
            $inc: {
              wallet: +dailyProfit,
              "extra.dailyProfit": dailyProfit
            }
          });

          console.log(`Wallet update result for user ${investment.user_id}: ${walletUpdate ? 'Success' : 'Failed'}`);

          // Create income record
          const incomeRecord = await incomeDbHandler.create({
            user_id: ObjectId(investment.user_id),
            investment_id: investment._id,
            type: 'daily_profit',
            amount: dailyProfit,
            status: 'credited',
            description: 'Daily ROI',
            extra: {
              investmentAmount: investment.amount,
              profitPercentage: roiRate
            }
          });

          console.log(`Income record created: ${incomeRecord ? 'Success' : 'Failed'}`);

          // Update last profit date
          const dateUpdate = await investmentDbHandler.updateByQuery({_id: investment._id}, {
            last_profit_date: today
          });

          console.log(`Last profit date updated: ${dateUpdate ? 'Success' : 'Failed'}`);

          processedCount++;
        } catch (investmentError) {
          console.error(`Error processing profit for investment ${investment._id}:`, investmentError);
        }
      }
    }

    console.log(`Daily profit processing completed. Processed ${processedCount} investments with total profit of $${totalProfit.toFixed(2)}`);

    return { success: true, processedCount, totalProfit };
  } catch (error) {
    console.error('Error processing daily trading profit:', error);
    return { success: false, error: error.message };
  }
};

// API endpoint for processing level ROI income
const processLevelRoiIncome = async (req, res) => {
  try {
    console.log("processLevelRoiIncome");
    const result = await _processLevelRoiIncome();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Level ROI income processed successfully',
        data: {
          processedUsers: result.processedCount,
          totalCommission: result.totalCommission
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process level ROI income',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in level ROI income API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing level ROI income',
      error: error.message
    });
  }
};

// API endpoint for processing daily trading profit
const processDailyTradingProfit = async (req, res) => {
  try {
    console.log("processDailyTradingProfit");
    const result = await _processDailyTradingProfit();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Daily trading profit processed successfully',
        data: {
          processedInvestments: result.processedCount,
          totalProfit: result.totalProfit
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process daily trading profit',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in daily profit API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing daily trading profit',
      error: error.message
    });
  }
};

// These cron jobs are now scheduled at lines 1528-1538

// Schedule active member rewards check (weekly)
cron.schedule('0 0 * * 0', _processActiveMemberReward, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule user rank updates (daily)
cron.schedule('0 1 * * *', () => _processUserRanks(), {
  scheduled: true,
  timezone: "UTC"
});

// API endpoint for processing team rewards
const processTeamRewards = async (req, res) => {
  try {
    console.log("Processing team rewards...");
    console.log("Request body:", req.body);

    // Check if API key is provided and valid
    if (!req.body.key) {
      console.error("API key not provided in request body");
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      console.error("Invalid API key provided");
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    console.log("API key validated successfully");
    const result = await _processTeamRewards();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Team rewards processed successfully'
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process team rewards',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in team rewards API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing team rewards',
      error: error.message
    });
  }
};

// Schedule daily ROI processing (every day at 1:00 AM UTC)       
cron.schedule('0 1 * * *', _processDailyTradingProfit, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule Level ROI Income processing (every day at 1:30 AM UTC)
cron.schedule('30 1 * * *', _processLevelRoiIncome, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule team rewards processing (every day at 2:00 AM UTC)
cron.schedule('0 2 * * *', _processTeamRewards, {
  scheduled: true,
  timezone: "UTC"
});

// Reset daily login counters and profit activation at midnight
const resetDailyLoginCounters = async (req, res) => {
  try {
    console.log('Resetting daily login counters and profit activation...');

    // Get all users directly using mongoose
    let updatedCount = 0;
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('Users');
      const users = await User.find({});

      console.log(`Found ${users.length} users using direct mongoose query`);

      // Update each user individually
      for (const user of users) {
        await userDbHandler.updateByQuery({_id: user._id}, {
          daily_logins: 0,
          rank_benefits_active: false,
          dailyProfitActivated: false // Reset daily profit activation flag
        });
        console.log(`Reset daily login counters and profit activation for user ${user.username || user.email}`);
        updatedCount++;
      }
    } catch (mongooseError) {
      console.error('Error querying users with mongoose:', mongooseError);
      throw mongooseError;
    }

    console.log(`Reset daily login counters for ${updatedCount} users`);

    // If this is called as an API endpoint, return a response
    if (res) {
      return res.status(200).json({
        status: true,
        message: 'Daily login counters reset successfully',
        data: { updatedCount }
      });
    }

    return { success: true, message: 'Daily login counters reset successfully', updatedCount };
  } catch (error) {
    console.error('Error resetting daily login counters:', error);

    // If this is called as an API endpoint, return a response
    if (res) {
      return res.status(500).json({
        status: false,
        message: 'Failed to reset daily login counters',
        error: error.message
      });
    }

    return { success: false, message: 'Failed to reset daily login counters', error };
  }
};

// Schedule daily login counter reset at midnight
cron.schedule('0 4 * * *', () => resetDailyLoginCounters(null, null), {
  scheduled: true,
  timezone: "UTC"
});

module.exports = {
  distributeTokensHandler,
  distributeLevelIncome,
  distributeGlobalAutoPoolMatrixIncome,
  AutoFundDistribution,
  processTeamCommission,
  processActiveMemberReward,
  processDailyTradingProfit,
  processLevelRoiIncome,
  processUserRanks,
  processTeamRewards,
  resetDailyLoginCounters,
  hasUserInvested // Export the utility function to check if a user has invested
};
