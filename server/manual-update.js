/**
 * Script to manually update trade activation records
 *
 * This script will:
 * 1. Directly update the trade activation records in the database
 * 2. Set profit_status to 'processed' for all pending activations from yesterday
 */

const { MongoClient, ObjectId } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI';

// Database Name
const dbName = 'hypertradeai';

async function manualUpdate() {
  let client;

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db(dbName);

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Processing activations between ${yesterday.toISOString()} and ${today.toISOString()}`);

    // Create a new cron execution record
    const cronExecution = {
      cron_name: 'daily_profit',
      start_time: new Date(),
      status: 'running',
      triggered_by: 'manual',
      server_info: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    const cronResult = await db.collection('cronexecutions').insertOne(cronExecution);
    const cronExecutionId = cronResult.insertedId;
    console.log(`Created cron execution record with ID: ${cronExecutionId}`);

    // Find pending trade activations
    const pendingActivations = await db.collection('tradeactivations').find({
      activation_date: {
        $gte: yesterday,
        $lt: today
      },
      status: 'active',
      profit_status: 'pending'
    }).toArray();

    console.log(`Found ${pendingActivations.length} pending trade activations for yesterday`);

    if (pendingActivations.length === 0) {
      console.log('No pending activations to process');
      await db.collection('cronexecutions').updateOne(
        { _id: cronExecutionId },
        {
          $set: {
            end_time: new Date(),
            status: 'completed',
            processed_count: 0,
            total_amount: 0,
            updated_at: new Date()
          }
        }
      );
      return;
    }

    let processedCount = 0;
    let totalProfit = 0;
    let errors = [];
    const startTime = Date.now();

    // Process each activation
    for (const activation of pendingActivations) {
      try {
        // Get user data
        const user = await db.collection('users').findOne({ _id: new ObjectId(activation.user_id) });
        if (!user) {
          console.log(`User not found for activation ${activation._id}`);
          errors.push({
            activation_id: activation._id,
            error: 'User not found'
          });
          continue;
        }

        console.log(`Processing activation for user ${user.email || user.username}`);

        // Check if user has active investments
        const activeInvestments = await db.collection('investments').find({
          user_id: new ObjectId(user._id),
          status: 'active'
        }).toArray();

        if (activeInvestments.length === 0) {
          console.log(`No active investments found for user ${user.email || user.username}`);
          await db.collection('tradeactivations').updateOne(
            { _id: new ObjectId(activation._id) },
            {
              $set: {
                profit_status: 'skipped',
                profit_error: 'No active investment found',
                cron_execution_id: cronExecutionId,
                updated_at: new Date()
              }
            }
          );
          continue;
        }

        // Process each investment
        for (const investment of activeInvestments) {
          // Get the investment plan
          const investmentPlan = await db.collection('investmentplans').findOne({ _id: new ObjectId(investment.investment_plan_id) });

          // Use the plan's percentage value or fall back to 0.266% if not available
          const roiRate = investmentPlan ? investmentPlan.percentage : 0.266;
          console.log(`Using ROI rate: ${roiRate}% for investment ${investment._id}`);

          // Calculate daily profit
          const dailyProfit = (investment.amount * roiRate) / 100;
          totalProfit += dailyProfit;

          // Create income record
          const incomeRecord = {
            user_id: new ObjectId(user._id),
            amount: dailyProfit,
            type: 'daily_profit',
            description: `Daily profit from investment of $${investment.amount}`,
            reference_id: new ObjectId(investment._id),
            status: 'completed',
            created_at: new Date(),
            updated_at: new Date()
          };

          const incomeResult = await db.collection('incomes').insertOne(incomeRecord);
          console.log(`Created income record with ID: ${incomeResult.insertedId}`);

          // Update user wallet
          await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            { $inc: { wallet: dailyProfit }, $set: { updated_at: new Date() } }
          );
          console.log(`Updated user wallet with profit: $${dailyProfit}`);

          // Update investment last profit date
          await db.collection('investments').updateOne(
            { _id: new ObjectId(investment._id) },
            { $set: { last_profit_date: new Date(), updated_at: new Date() } }
          );
          console.log(`Updated investment last profit date`);

          // Update trade activation record
          await db.collection('tradeactivations').updateOne(
            { _id: new ObjectId(activation._id) },
            {
              $set: {
                profit_status: 'processed',
                profit_processed_at: new Date(),
                profit_amount: dailyProfit,
                profit_details: {
                  investment_id: investment._id,
                  investment_amount: investment.amount,
                  profit_rate: roiRate,
                  income_id: incomeResult.insertedId
                },
                cron_execution_id: cronExecutionId,
                updated_at: new Date()
              }
            }
          );
          console.log(`Updated trade activation record`);

          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing activation ${activation._id}:`, error);
        errors.push({
          activation_id: activation._id,
          error: error.message
        });
      }
    }

    // Update the cron execution record
    const endTime = Date.now();
    const duration = endTime - startTime;

    await db.collection('cronexecutions').updateOne(
      { _id: cronExecutionId },
      {
        $set: {
          end_time: new Date(),
          duration_ms: duration,
          status: errors.length > 0 ? 'partial_success' : 'completed',
          processed_count: processedCount,
          total_amount: totalProfit,
          error_count: errors.length,
          error_details: errors.length > 0 ? errors : [],
          execution_details: {
            total_activations: pendingActivations.length,
            processed_count: processedCount,
            skipped_count: pendingActivations.length - processedCount
          },
          updated_at: new Date()
        }
      }
    );

    console.log('\nSummary:');
    console.log(`Total activations processed: ${pendingActivations.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Total profit distributed: $${totalProfit.toFixed(2)}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Duration: ${duration}ms`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the function
manualUpdate();
