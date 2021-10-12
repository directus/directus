import express, { RequestHandler } from 'express';
import env from '../env';
import { InvalidPayloadException } from '../exceptions';

const payloadSizeLimiter: RequestHandler = (req, res, next) => {
	(
		express.json({
			limit: env.MAX_PAYLOAD_SIZE,
		}) as RequestHandler
	)(req, res, (err: any) => {
		if (err) {
			return next(new InvalidPayloadException(err.message));
		}

		return next();
	});
};

export default payloadSizeLimiter;
