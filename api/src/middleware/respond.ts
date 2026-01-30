import { useEnv } from '@directus/env';
import { getDateTimeFormatted } from '@directus/utils';
import { parse as parseBytesConfiguration } from 'bytes';
import type { RequestHandler } from 'express';
import { getCache, setCacheValue } from '../cache.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { ExportService } from '../services/import-export.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getCacheKey } from '../utils/get-cache-key.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { stringByteSize } from '../utils/get-string-byte-size.js';
import { permissionsCacheable } from '../utils/permissions-cacheable.js';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	const env = useEnv();
	const logger = useLogger();

	const { cache } = getCache();

	// Support custom cache instance and TTL via res.locals
	const cacheInstance = res.locals['cacheInstance'] || cache;
	const cacheTTL = res.locals['cacheTTL'] ?? getMilliseconds(env['CACHE_TTL']);
	const hasCustomCache = !!res.locals['cacheInstance'];

	let exceedsMaxSize = false;

	if (env['CACHE_VALUE_MAX_SIZE'] !== false) {
		const valueSize = res.locals['payload'] ? stringByteSize(JSON.stringify(res.locals['payload'])) : 0;
		const maxSize = parseBytesConfiguration(env['CACHE_VALUE_MAX_SIZE'] as string);
		if (maxSize !== null) exceedsMaxSize = valueSize > maxSize;
	}

	// Custom cache bypasses global cache settings (CACHE_ENABLED, permissionsCacheable)
	const shouldCache = hasCustomCache
		? res.locals['cache'] !== false && cacheInstance && !req.sanitizedQuery.export && exceedsMaxSize === false
		: (req.method.toLowerCase() === 'get' || req.originalUrl?.startsWith('/graphql')) &&
			req.originalUrl?.startsWith('/auth') === false &&
			env['CACHE_ENABLED'] === true &&
			cache &&
			!req.sanitizedQuery.export &&
			res.locals['cache'] !== false &&
			exceedsMaxSize === false &&
			(await permissionsCacheable(
				req.collection,
				{
					knex: getDatabase(),
					schema: req.schema,
				},
				req.accountability,
			));

	if (shouldCache) {
		const key = await getCacheKey(req);

		try {
			await setCacheValue(cacheInstance, key, res.locals['payload'], cacheTTL);
			await setCacheValue(cacheInstance, `${key}__expires_at`, { exp: Date.now() + cacheTTL });
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't set key ${key}. ${err}`);
		}

		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL, !hasCustomCache, true));
		res.setHeader('Vary', 'Origin, Cache-Control');
	} else if (res.locals['cacheTTL'] !== undefined) {
		// Custom TTL for headers only (no storage) - useful when caching is handled elsewhere
		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL, false, true));
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

		filename += ' ' + getDateTimeFormatted();

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

		if (req.sanitizedQuery.export === 'csv_utf8') {
			res.attachment(`${filename}.csv`);
			res.set('Content-Type', 'text/csv; charset=utf-8');
			return res.status(200).send(exportService.transform(res.locals['payload']?.data, 'csv_utf8'));
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
