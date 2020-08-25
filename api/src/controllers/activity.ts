import express from 'express';
import redis from 'redis';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import cacheMiddleware from '../middleware/cache';
import CacheService from '../services/node-cache';
import ActivityService from '../services/activity';
import MetaService from '../services/meta';
import { Action } from '../types';
import env from '../env';

const redisClient = redis.createClient({
	enable_offline_queue: false,
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

const router = express.Router();

router.get(
	'/',
	useCollection('directus_activity'),
	sanitizeQuery,
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);

		const service = new ActivityService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);
		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(
					key,
					TTLnum,
					JSON.stringify({
						data: records || null,
						meta,
					})
				);
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(
					key,
					JSON.stringify({
						data: records || null,
						meta,
					})
				);
			}
		}
		return res.json({
			data: records || null,
			meta,
		});
	})
);

router.get(
	'/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	cacheMiddleware,
	asyncHandler(async (req, res) => {
		const key = req.url;
		const TTL = req.query.TTL;
		const TTLnum = Number(TTL);
		const dTTL = Number(req.query.dTTL);
		const service = new ActivityService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		if (TTL) {
			if (env.CACHE_TYPE === 'redis') {
				redisClient.setex(
					key,
					TTLnum,
					JSON.stringify({
						data: record || null,
					})
				);
			} else {
				const cacheService = new CacheService(TTLnum, dTTL);
				cacheService.setCache(
					key,
					JSON.stringify({
						data: record || null,
					})
				);
			}
		}

		return res.json({
			data: record || null,
		});
	})
);

router.post(
	'/comment',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });

		const primaryKey = await service.create({
			...req.body,
			action: Action.COMMENT,
			action_by: req.accountability?.user,
			ip: req.ip,
			user_agent: req.get('user-agent'),
		});

		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

router.patch(
	'/comment/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

router.delete(
	'/comment/:pk',
	useCollection('directus_activity'),
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return res.status(200).end();
	})
);

export default router;
