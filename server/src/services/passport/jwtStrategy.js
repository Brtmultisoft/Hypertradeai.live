const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('../../config/config');
//Jwt strategy options for validating token
const jwt_options = {
	jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey : config.jwtTokenInfo.secretKey,
	issuer : config.jwtTokenInfo.issuer,
	audience : config.jwtTokenInfo.audience
};
//create new jwt strategy for token authentication
const jwtStrategy = new JwtStrategy(jwt_options, function(jwt_payload, done) {
	try{
		return done(null, jwt_payload,{});
	}
	catch(error){
		return done(error);
	}
});

module.exports = jwtStrategy;