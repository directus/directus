import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import emitter from '../emitter';
import logger from '../logger';

const responseHook: RequestHandler = asyncHandler((req, res, next) => {
	res.on('close', afterResponse);

	const startTime = process.hrtime();

	return next();

	function afterResponse() {
		res.removeListener('close', afterResponse);

		const info = {
			request: {
				method: req.method,
				uri: req.path,
				url: req.protocol + '://' + req.get('host') + req.originalUrl,
				size: req.socket.bytesRead,
				query: req.query,
				headers: req.headers,
			},
			response: {
				status: res.statusCode,
				size: (res as any)['_contentLength'] || res.getHeader('content-length'),
				headers: res.getHeaders(),
			},
			ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			duration: (process.hrtime(startTime)[1] / 1000000).toFixed(),
		};

		emitter.emitAsync('response', info).catch((err) => logger.warn(err));
	}
});

export default responseHook;
