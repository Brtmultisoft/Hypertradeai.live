const express = require('express');
const cors = require('cors');
const { authenticator } = require("otplib");
const qrcode = require("qrcode");

const app = express();
const PORT = 3001;

// Configure authenticator options
authenticator.options = {
    step: 30,        // Time step in seconds (30 is standard)
    window: 1,       // Allow ±1 time step (±30 seconds)
    digits: 6,       // 6-digit codes
    algorithm: 'sha1' // SHA1 algorithm (standard for Google Authenticator)
};

// Middleware
app.use(cors({
    origin: ['http://localhost:2013', 'http://localhost:2014', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// In-memory storage for testing (replace with database in production)
const testUsers = {
    'test@example.com': {
        email: 'test@example.com',
        two_fa_secret: '',
        two_fa_enabled: false,
        two_fa_method: 'otpless'
    }
};

// Test endpoint to generate 2FA secret
app.post('/api/v1/user/generate-2fa-secret', async (req, res) => {
    try {
        console.log('Generating 2FA secret...');
        
        const email = 'test@example.com'; // Mock user
        const user = testUsers[email];
        
        if (user.two_fa_enabled && user.two_fa_method === 'totp') {
            return res.status(400).json({
                status: false,
                msg: "Google Authenticator 2FA already verified and enabled!",
                data: { 
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method 
                }
            });
        }

        const secret = authenticator.generateSecret();
        user.two_fa_secret = secret;
        user.two_fa_method = 'totp';
        
        const appName = 'HypertradeAI';

        // Generate QR code URI
        const otpAuthUrl = authenticator.keyuri(email, appName, secret);
        
        // Generate QR code with smaller size and error correction
        const qrImageDataUrl = await qrcode.toDataURL(otpAuthUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256
        });

        console.log('2FA secret generated successfully:', {
            email,
            secret,
            appName
        });

        res.json({
            status: true,
            msg: `Google Authenticator secret generated successfully!`,
            data: {
                secret: secret,
                qrImageDataUrl: qrImageDataUrl,
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
                manual_entry_key: secret,
                app_name: appName,
                account_name: email,
                otpauth_url: otpAuthUrl
            }
        });
    } catch (error) {
        console.error('Failed to generate 2FA secret:', error);
        res.status(500).json({
            status: false,
            msg: 'Failed to generate Google Authenticator secret',
            error: error.message
        });
    }
});

// Test endpoint to verify OTP
app.post('/api/v1/user/verify-otp', async (req, res) => {
    try {
        const { token } = req.body;
        console.log('Verifying OTP:', token);
        
        const email = 'test@example.com'; // Mock user
        const user = testUsers[email];

        if (user.two_fa_enabled && user.two_fa_method === 'totp') {
            return res.status(400).json({
                status: false,
                msg: "Google Authenticator 2FA already verified and enabled!",
                data: { 
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method 
                }
            });
        }

        const cleanToken = token.replace(/\s/g, ""); // Remove all whitespace
        
        // Validate token format
        if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
            return res.status(400).json({
                status: false,
                msg: "Please enter a valid 6-digit code from your authenticator app."
            });
        }

        // Validate secret exists
        if (!user.two_fa_secret) {
            return res.status(400).json({
                status: false,
                msg: "2FA secret not found. Please set up Google Authenticator again."
            });
        }

        // Use authenticator.verify with window tolerance for better compatibility
        const verifyOptions = {
            token: cleanToken,
            secret: user.two_fa_secret,
            window: 2 // Allow ±2 time steps (±60 seconds) for clock drift
        };

        const isValid = authenticator.verify(verifyOptions);
        
        console.log('TOTP verification result:', {
            isValid: isValid,
            token: cleanToken,
            secretPresent: !!user.two_fa_secret,
            currentTime: new Date().toISOString(),
            currentToken: authenticator.generate(user.two_fa_secret)
        });

        if (!isValid) {
            return res.status(400).json({
                status: false,
                msg: "The entered Google Authenticator code is invalid or expired. Please ensure your device time is synchronized and try the current code from your app.",
                data: {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method
                }
            });
        }

        // Success - enable 2FA
        user.two_fa_enabled = true;
        user.two_fa_method = 'totp';

        console.log('2FA enabled successfully for user:', email);

        res.json({
            status: true,
            msg: `Google Authenticator 2FA enabled successfully!`,
            data: {
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
            }
        });
    } catch (error) {
        console.error('Failed to verify Google Authenticator OTP:', error);
        res.status(500).json({
            status: false,
            msg: 'Failed to verify Google Authenticator code',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: '2FA Test Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 2FA Test Server running on http://localhost:${PORT}`);
    console.log(`📱 Test the endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/v1/user/generate-2fa-secret`);
    console.log(`   POST http://localhost:${PORT}/api/v1/user/verify-otp`);
});
