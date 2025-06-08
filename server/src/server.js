'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const env = require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const helmet = require('helmet');
const passport = require('passport');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./utils/connection');
const log = require('./services/logger').getAppLevelInstance();
const passportService = require('./services/passport');
const routeService = require('./routes');
const {
    securityHeaders,
    sanitizeRequest,
    preventParameterPollution,
    xss,
    apiLimiter,
    authLimiter,
    generateCsrfToken,
    verifyCsrfToken,
    securityLogger
} = require('./middlewares/security.middleware');
/********************************
 * LOAD SERVER EXPRESS SERVER
 ********************************/
class Server {
    constructor() {
        //Intializing Express Function
        this._app = express();
        this._server = new http.createServer(this._app);
        // Note: _initializeApp is now async and will be called in start()
    }

    async _initializeApp() {
        this._loadCors();
        this._loadBodyParser();
        this._loadCompression();
        this._loadMongoSanitize();
        this._loadHelmet();
        await this._loadDatabaseConnection();
        this._loadPassPort();
        this._loadStaticFiles();
        this._loadSecurityMiddlewares();
    }
    _loadCors() {
        //setting up the cors policy
        let corsOption = { origin: '*' };
        this._app.use(cors(corsOption));
    }
    _loadBodyParser() {
        //Handling Body Parser for parsing Incoming Data request
        this._app.use(
            bodyParser.json()
        );
        this._app.use(
            bodyParser.urlencoded({
                extended: true,
            })
        );
    }
    _loadCompression() {
        //compress the outgoing response
        this._app.use(compression());
    }
    _loadStaticFiles() {
        //Handling Static files with Express
        this._app.use(express.static('public'));
    }
    _loadHelmet() {
        //set HTTP response headers
        this._app.use(helmet());
    }
    _loadMongoSanitize() {
        //sanitize mongodb query
        this._app.use(mongoSanitize());
    }
    async _loadDatabaseConnection() {
        //Connect to mongodb
        try {
            await connectDatabase();
            log.info('Database connection loaded successfully');
        } catch (error) {
            log.error('Failed to load database connection:', error);
            log.warn('Server will start with limited functionality (database-dependent features disabled)');
            // Don't throw error - allow server to start without database
        }
    }
    _loadPassPort() {
        //initialize passport and invoke passport jwt token authentication function
        passport.initialize();
        passportService();
    }
    _loadRoutes() {
        //load Route services
        routeService(this._app);
    }
    _loadSecurityMiddlewares() {
        // Parse cookies for CSRF protection
        this._app.use(cookieParser());

        // Security headers
        this._app.use(securityHeaders);

        // Security logging
        this._app.use(securityLogger);

        // API rate limiting - apply to all routes
        this._app.use(apiLimiter);

        // Stricter rate limiting for auth routes
        this._app.use('/admin/login', authLimiter);
        this._app.use('/user/login', authLimiter);
        this._app.use('/user/signup', authLimiter);
        this._app.use('/user/forgot/password', authLimiter);

        // CSRF protection
        this._app.use(generateCsrfToken);
        this._app.use(verifyCsrfToken);

        // Data sanitization
        this._app.use(sanitizeRequest);
        this._app.use(preventParameterPollution);
        this._app.use(xss());

        // Add security headers to response
        this._app.use((req, res, next) => {
            // Set additional security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Add Cache-Control headers to prevent sensitive information caching
            if (req.path.includes('/admin') || req.path.includes('/user')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('Surrogate-Control', 'no-store');
            }

            next();
        });
    }
    async start() {
        //Start Express Server
        try {
            // Initialize the app (includes database connection)
            await this._initializeApp();

            // Load routes
            this._loadRoutes();

            // Start the server
            return new Promise((resolve, reject) => {
                this._server.listen(process.env.NODE_PORT, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                this._server.on('error', (this._onError = this._onError.bind(this)));
                this._server.on(
                    'listening',
                    (this._onListening = this._onListening.bind(this))
                );
            });
        } catch (error) {
            this._onError(error);
            return Promise.reject(error);
        }
    }
    _onError(error) {
        log.error('failed to start API server with error::', error);
    }
    _onListening() {
        const addressInfo = this._server.address();
        log.info(
            `API server listening on Address: ${addressInfo.address} and port : ${addressInfo.port}`
        );
    }
}

module.exports = Server;