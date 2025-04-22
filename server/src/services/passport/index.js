const passport = require('passport');
const jwtStrategy = require('./jwtStrategy');
/************************************************************
 * SERVICE METHODS FOR HANDLING TOKEN AUTHENTICATION STRATEGY
 ************************************************************/
module.exports = () => {
	passport.use(jwtStrategy);
};