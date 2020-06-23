import passport from 'passport';
import JWTStrategy from './strategies/jwt';

passport.use(JWTStrategy);

export default passport;
