import { Strategy, ExtractJwt } from 'passport-jwt';
import database from '../../database';
import APIError, { ErrorCode } from '../../error';

const JWTStrategy = new Strategy(
	{
		secretOrKey: process.env.SECRET,
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	},
	async (payload, done) => {
		// This is just an extra verification to make sure the user actually exists when you're trying to
		// use it
		const users = await database.select('id').from('directus_users').where({ id: payload.id });

		if (users && users[0]) {
			return done(null, users[0]);
		}

		return done(new APIError(ErrorCode.USER_NOT_FOUND, 'User not found.'));
	}
);

export default JWTStrategy;
