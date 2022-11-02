import { RequestHandler } from 'express';
import ms from 'ms';
import { getCache, setCacheValue } from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheKey } from '../utils/get-cache-key';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import logger from '../logger';
import { ExportService } from '../services';
import { getDateFormatted } from '../utils/get-date-formatted';
import { stringByteSize } from '../utils/get-string-byte-size';
import { parse as parseBytesConfiguration } from 'bytes';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	const { cache } = getCache();

	let exceedsMaxSize = false;

	if (env.CACHE_VALUE_MAX_SIZE !== false) {
		const valueSize = res.locals.payload ? stringByteSize(JSON.stringify(res.locals.payload)) : 0;
		const maxSize = parseBytesConfiguration(env.CACHE_VALUE_MAX_SIZE);
		exceedsMaxSize = valueSize > maxSize;
	}

	if (
		(req.method.toLowerCase() === 'get' || req.originalUrl?.startsWith('/graphql')) &&
		env.CACHE_ENABLED === true &&
		cache &&
		!req.sanitizedQuery.export &&
		res.locals.cache !== false &&
		exceedsMaxSize === false
	) {
		const key = getCacheKey(req);

		try {
			await setCacheValue(cache, key, res.locals.payload, ms(env.CACHE_TTL as string));
			await setCacheValue(cache, `${key}__expires_at`, { exp: Date.now() + ms(env.CACHE_TTL as string) });
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't set key ${key}. ${err}`);
		}

		res.setHeader('Cache-Control', getCacheControlHeader(req, ms(env.CACHE_TTL as string)));
		res.setHeader('Vary', 'Origin, Cache-Control');
	} else {
		// Don't cache anything by default
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Vary', 'Origin, Cache-Control');
	}

	if (req.sanitizedQuery.export) {
		const exportService = new ExportService({ accountability: req.accountability, schema: req.schema });

		let filename = '';

		if (req.collection) {
			filename += req.collection;
		} else {
			filename += 'Export';
		}

		filename += ' ' + getDateFormatted();

		if (req.sanitizedQuery.export === 'json') {
			res.attachment(`${filename}.json`);
			res.set('Content-Type', 'application/json');
			return res.status(200).send(exportService.transform(res.locals.payload?.data, 'json'));
		}

		if (req.sanitizedQuery.export === 'xml') {
			res.attachment(`${filename}.xml`);
			res.set('Content-Type', 'text/xml');
			return res.status(200).send(exportService.transform(res.locals.payload?.data, 'xml'));
		}

		if (req.sanitizedQuery.export === 'csv') {
			res.attachment(`${filename}.csv`);
			res.set('Content-Type', 'text/csv');
			return res.status(200).send(exportService.transform(res.locals.payload?.data, 'csv'));
		}
	}

	if (Buffer.isBuffer(res.locals.payload)) {
		return res.end(res.locals.payload);
	} else if (res.locals.payload) {
		return res.json(res.locals.payload);
	} else {
		return res.status(204).end();
	}
});
