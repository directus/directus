import { RequestHandler } from 'express';

const poweredBy: RequestHandler = (req, res, next) => {
	res.setHeader('X-Powered-By', 'Directus');
	next();
};

export default poweredBy;
