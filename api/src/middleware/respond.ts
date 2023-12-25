import { parse as parseBytesConfiguration } from 'bytes';
import type { RequestHandler } from 'express';
import { assign } from 'lodash-es';
import { getCache, setCacheValue } from '../cache.js';
import { useEnv } from '../env.js';
import { useLogger } from '../logger.js';
import { ExportService } from '../services/import-export/index.js';
import { VersionsService } from '../services/versions.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getCacheKey } from '../utils/get-cache-key.js';
import { getDateFormatted } from '../utils/get-date-formatted.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { stringByteSize } from '../utils/get-string-byte-size.js';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	const env = useEnv();
	const logger = useLogger();

	const { cache } = getCache();

	let exceedsMaxSize = false;

	if (env['CACHE_VALUE_MAX_SIZE'] !== false) {
		const valueSize = res.locals['payload'] ? stringByteSize(JSON.stringify(res.locals['payload'])) : 0;
		const maxSize = parseBytesConfiguration(env['CACHE_VALUE_MAX_SIZE']);
		exceedsMaxSize = valueSize > maxSize;
	}

	if (
		req.sanitizedQuery.version &&
		req.collection &&
		(req.singleton || req.params['pk']) &&
		'data' in res.locals['payload']
	) {
		const versionsService = new VersionsService({ accountability: req.accountability ?? null, schema: req.schema });

		const saves = await versionsService.getVersionSaves(req.sanitizedQuery.version, req.collection, req.params['pk']);

		if (saves) {
			assign(res.locals['payload'].data, ...saves);
		}
	}

	if (
		(req.method.toLowerCase() === 'get' || req.originalUrl?.startsWith('/graphql')) &&
		env['CACHE_ENABLED'] === true &&
		cache &&
		!req.sanitizedQuery.export &&
		res.locals['cache'] !== false &&
		exceedsMaxSize === false
	) {
		const key = getCacheKey(req);

		try {
			await setCacheValue(cache, key, res.locals['payload'], getMilliseconds(env['CACHE_TTL']));
			await setCacheValue(cache, `${key}__expires_at`, { exp: Date.now() + getMilliseconds(env['CACHE_TTL'], 0) });
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't set key ${key}. ${err}`);
		}

		res.setHeader('Cache-Control', getCacheControlHeader(req, getMilliseconds(env['CACHE_TTL']), true, true));
		res.setHeader('Vary', 'Origin, Cache-Control');
	} else {
		// Don't cache anything by default
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Vary', 'Origin, Cache-Control');
	}

	if (req.sanitizedQuery.export) {
		const exportService = new ExportService({ accountability: req.accountability ?? null, schema: req.schema });

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
			return res.status(200).send(exportService.transform(res.locals['payload']?.data, 'json'));
		}

		if (req.sanitizedQuery.export === 'xml') {
			res.attachment(`${filename}.xml`);
			res.set('Content-Type', 'text/xml');
			return res.status(200).send(exportService.transform(res.locals['payload']?.data, 'xml'));
		}

		if (req.sanitizedQuery.export === 'csv') {
			res.attachment(`${filename}.csv`);
			res.set('Content-Type', 'text/csv');
			return res.status(200).send(exportService.transform(res.locals['payload']?.data, 'csv'));
		}

		if (req.sanitizedQuery.export === 'yaml') {
			res.attachment(`${filename}.yaml`);
			res.set('Content-Type', 'text/yaml');
			return res.status(200).send(exportService.transform(res.locals['payload']?.data, 'yaml'));
		}
	}

	if (Buffer.isBuffer(res.locals['payload'])) {
		return res.end(res.locals['payload']);
	} else if (res.locals['payload']) {
		return res.json(res.locals['payload']);
	} else {
		return res.status(204).end();
	}
});
