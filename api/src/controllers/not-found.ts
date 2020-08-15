import { RequestHandler } from 'express';
import { RouteNotFoundException } from '../exceptions';

const notFound: RequestHandler = (req, res, next) => {
	throw new RouteNotFoundException(req.path);
};

export default notFound;
