import { RequestHandler } from 'express';
import APIError, { ErrorCode } from '../error';

const notFound: RequestHandler = (req, res, next) => {
	throw new APIError(ErrorCode.NOT_FOUND, `Route ${req.path} not found.`);
};

export default notFound;
