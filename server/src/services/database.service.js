'use strict';

const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('./logger');
const log = logger.getAppLevelInstance();

/**
 * Database Service
 * 
 * A singleton service that manages the MongoDB connection
 * throughout the application's lifecycle.
 */
class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000; // 5 seconds
    
    // Configure mongoose
    mongoose.set('strictQuery', true);
    
    // Setup connection event handlers
    this._setupConnectionHandlers();
  }
  
  /**
   * Set up mongoose connection event handlers
   */
  _setupConnectionHandlers() {
    mongoose.connection.on('connecting', () => {
      log.info('Trying to establish a connection with the database');
      this.isConnecting = true;
    });

    mongoose.connection.on('connected', () => {
      log.info('Database connection established successfully');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    mongoose.connection.on('error', (err) => {
      log.error('Database connection error:', err);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Attempt to reconnect if not already reconnecting
      if (!this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this._scheduleReconnect();
      }
    });

    mongoose.connection.on('disconnected', () => {
      log.info('Database connection closed');
      this.isConnected = false;
      
      // Attempt to reconnect if not already reconnecting
      if (!this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this._scheduleReconnect();
      }
    });
  }
  
  /**
   * Schedule a reconnection attempt
   */
  _scheduleReconnect() {
    this.reconnectAttempts++;
    log.info(`Scheduling database reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
    
    setTimeout(() => {
      this.connect().catch(err => {
        log.error('Failed to reconnect to database:', err);
      });
    }, this.reconnectInterval);
  }
  
  /**
   * Connect to MongoDB
   * @param {string} [databaseUrl] - Optional database URL to override config
   * @returns {Promise<mongoose.Connection>} - Mongoose connection
   */
  connect(databaseUrl) {
    // If already connected, return the existing connection
    if (mongoose.connection.readyState === 1) {
      log.info('Already connected to MongoDB');
      return Promise.resolve(mongoose.connection);
    }
    
    // If already connecting, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      log.info('Connection to MongoDB already in progress');
      return this.connectionPromise;
    }
    
    // Start a new connection
    this.isConnecting = true;
    
    // Connection options
    const options = { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      dbName: config.dbName,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      heartbeatFrequencyMS: 10000,     // 10 seconds
      socketTimeoutMS: 45000,          // 45 seconds
      family: 4                        // Use IPv4
    };
    
    const mongoUrl = databaseUrl || config.databaseUrl;
    log.info(`Connecting to MongoDB at ${mongoUrl}`);
    
    // Create and store the connection promise
    this.connectionPromise = mongoose.connect(mongoUrl, options)
      .then(connection => {
        this.isConnected = true;
        this.isConnecting = false;
        log.info('MongoDB connection successful');
        return connection;
      })
      .catch(err => {
        this.isConnecting = false;
        log.error('Failed to connect to MongoDB:', err);
        throw err;
      });
    
    return this.connectionPromise;
  }
  
  /**
   * Get the current connection status
   * @returns {boolean} - True if connected
   */
  isConnectedToDatabase() {
    return mongoose.connection.readyState === 1;
  }
  
  /**
   * Get the mongoose connection
   * @returns {mongoose.Connection} - Mongoose connection
   */
  getConnection() {
    return mongoose.connection;
  }
  
  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      log.info('Closing MongoDB connection');
      await mongoose.disconnect();
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }
}

// Create and export a singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;
