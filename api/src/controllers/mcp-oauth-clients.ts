import { Router } from 'express';
import { respond } from '../middleware/respond.js';
import { ItemsService } from '../services/items.js';
import asyncHandler from '../utils/async-handler.js';

const router = Router();

// Permissions handled by ItemsService via req.accountability.
// Admin users: validateAccess returns immediately (admin === true).
// Non-admin users: no access policies exist for directus_oauth_clients, so they get 403.

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
