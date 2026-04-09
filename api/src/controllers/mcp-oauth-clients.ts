import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { Router } from 'express';
import { respond } from '../middleware/respond.js';
import { ItemsService } from '../services/items.js';
import asyncHandler from '../utils/async-handler.js';

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
	asyncHandler(async (req, res, next) => {
		if (!Array.isArray(req.body)) {
			throw new InvalidPayloadError({ reason: 'Expected an array of client IDs' });
		}

		const service = new ItemsService('directus_oauth_clients', {
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteMany(req.body);
		res.locals['payload'] = undefined;
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
