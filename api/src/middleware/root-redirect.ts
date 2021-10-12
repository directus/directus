import { RequestHandler } from 'express';
import env from '../env';

const rootRedirect: RequestHandler = (req, res, next) => {
	if (env.ROOT_REDIRECT) {
		res.redirect(env.ROOT_REDIRECT);
	} else {
		next();
	}
};

export default rootRedirect;
