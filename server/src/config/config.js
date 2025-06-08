require("dotenv").config({ path: require('path').join(__dirname, '../../.env') });

/*************************
 * ENVIRONMENT VARIABLES
 **************************/
module.exports = {
    socialMediaVerificationEndpoint: process.env['SOCIAL_MEDIA_VERIFICATION_ENDPOINT'],
    ethNodeUrl: process.env['ETH_NODE_URL'],
    appApiKey: process.env['APP_API_KEY'],
    withdrawalApiUrl: process.env['WITHDRAWAL_API_URL'],
    tokenSymbol: process.env['TOKEN_SYMBOL'],
    privKey: process.env['APP_PRIV_KEY'],
    withdrawAddress: process.env['WITHDRAW_ADDRESS'],
    withdrawABI: process.env['WITHDRAW_ABI'],
    contractDepositAddress: process.env["DEPOSIT_CONTRACT_ADDRESS"],
    depositAddress: process.env["DEPOSIT_ADDRESS"],
    databaseUrl: process.env['DB_URL'],
    dbName: process.env['DB_NAME'],
    BaseUrl: process.env['BASE_URL'],
    frontendUrl: process.env['FRONTEND_URL'],
    frontendTestUrl: process.env['FRONTEND_TEST_URL'],
    appLive: process.env['APP_LIVE'],
    brandName: process.env['BRAND_NAME'],
    loginByType: process.env['LOGIN_BY_TYPE'],
    loginByName: process.env['LOGIN_BY_NAME'],
    emailCheck: process.env['EMAIL_CHECK'],
    phoneCheck: process.env['PHONE_CHECK'],
    jwtTokenInfo: {
        secretKey: process.env['JWT_SECRET_KEY_USER'],
        issuer: process.env['JWT_ISSUER'],
        audience: process.env['JWT_AUDIENCE'],
        algorithm: 'HS256',
        expiresIn: '7d' // Reduced to 7 days for better security (was 5 years)
    },
    adminJwtTokenInfo: {
        secretKey: process.env['JWT_SECRET_KEY_ADMIN'],
        issuer: process.env['JWT_ISSUER'],
        audience: process.env['JWT_AUDIENCE'],
        algorithm: 'HS256',
        expiresIn: '12h' // Reduced to 12 hours for better security (was 24h)
    },
    emailTokenInfo: {
        secretKey: process.env['JWT_SECRET_KEY_EMAIL'],
        issuer: process.env['JWT_ISSUER'],
        audience: process.env['JWT_AUDIENCE'],
        algorithm: 'HS256',
        expiresIn: '1h'
    },
    mobileTokenInfo: {
        secretKey: process.env['JWT_SECRET_KEY_MOBILE'],
        issuer: process.env['JWT_ISSUER'],
        audience: process.env['JWT_AUDIENCE'],
        algorithm: 'HS256',
        expiresIn: '1h'
    },
    passwordResetTokenInfo: {
        secretKey: process.env['JWT_SECRET_KEY_PASSWORD'],
        issuer: process.env['JWT_ISSUER'],
        audience: process.env['JWT_AUDIENCE'],
        algorithm: 'HS256',
        expiresIn: '1h'
    },
    emailServiceInfo: {
        serviceActive: 'smtp',
        fromEmail: process.env['FROM_EMAIL'],
        fromName: process.env['BRAND_NAME'],
        supportEmail: process.env['SUPPORT_EMAIL'],
        smtp: {
            host: process.env['SMTP_HOST'],
            port: process.env['SMTP_PORT'],
            userName: process.env['SMTP_USER_NAME'],
            password: process.env['SMTP_PASSWORD']
        }
    },
    bcrypt: {
        saltValue: 12, // Increased from 8 to 12 for better security
        pepper: process.env['PASSWORD_PEPPER'] || 'default-pepper-value-change-in-production'
    },
    crypto: {
        secretKey: ''
    },
    aws: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
        region: process.env['AWS_REGION'],
        s3Bucket: process.env['AWS_S3_BUCKET'],
        s3AvatarBucket: process.env['AWS_S3_AVATAR_BUKET']
    },
    upload_path: 'public/uploads',
    aes: {
        algorithm: process.env['AES_ALGORITHM'] || 'aes256',
        key: process.env['AES_KEY'] || 'password'
    },
    tokenDistributionByYear: {
        1: 12000, // 1st Year
        2: 6000,  // 2nd Year
        3: 3000,  // 3rd Year
        4: 1500   // 4th Year
    },
    levelIncomePercentages: [25, 15, 10], // Level 1 to Level 8
    adminWallets: [
        "65a1234567890abcd1234567",
        "65a234567890abcd12345678",
        "65a34567890abcd123456789",
        "65a4567890abcd1234567890"
    ],
    rewardWallet: "65a567890abcd12345678901", // Reward and Achiever Wallet
    startDate: new Date('2025-01-01') // Start date of distribution

};