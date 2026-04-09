import { ForbiddenError } from '@directus/errors';
import { Router } from 'express';
import { respond } from '../middleware/respond.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { ItemsService } from '../services/items.js';
import asyncHandler from '../utils/async-handler.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = Router();

// Explicit admin guard -- defense in depth on top of ItemsService permissions
router.use((req, _res, next) => {
	if (!req.accountability?.admin) {
		throw new ForbiddenError();
	}

	next();
});

// GET / -- list all clients
router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_oauth_clients', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const records = await service.readByQuery(req.sanitizedQuery);
		res.locals['payload'] = { data: records || null };
		return next();
	}),
	respond,
);

// GET /:id -- single client
router.get(
	'/:id',
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_oauth_clients', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params['id']!, req.sanitizedQuery);
		res.locals['payload'] = { data: record || null };
		return next();
	}),
	respond,
);

// DELETE / -- bulk revoke (delete) clients, FK cascade handles cleanup
router.delete(
	'/',
	validateBatch('delete'),
	asyncHandler(async (req, _res, next) => {
		const service = new ItemsService('directus_oauth_clients', {
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			const sanitizedQuery = await sanitizeQuery(req.body.query, req.schema, req.accountability);
			await service.deleteByQuery(sanitizedQuery);
		}

		return next();
	}),
	respond,
);

// DELETE /:id -- revoke (delete) client, FK cascade handles cleanup
router.delete(
	'/:id',
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_oauth_clients', {
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['id']!);
		res.locals['payload'] = undefined;
		return next();
	}),
	respond,
);

export default router;
