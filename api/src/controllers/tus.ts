import getDatabase from '../database/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createTusServer } from '../services/tus/index.js';
import asyncHandler from '../utils/async-handler.js';
import type { PermissionsAction } from '@directus/types';
import { Router } from 'express';

const mapAction = (method: string): PermissionsAction => {
	switch (method) {
		case 'POST':
			return 'create';
		case 'PATCH':
			return 'update';
		case 'DELETE':
			return 'delete';
		default:
			return 'read';
	}
};

const checkFileAccess = asyncHandler(async (req, _res, next) => {
	if (req.accountability) {
		const action = mapAction(req.method);

		await validateAccess(
			{
				action,
				collection: 'directus_files',
				accountability: req.accountability,
			},
			{
				schema: req.schema,
				knex: getDatabase(),
			},
		);
	}

	return next();
});

const handler = asyncHandler(async (req, res) => {
	const [tusServer, cleanupServer] = await createTusServer({
		schema: req.schema,
		accountability: req.accountability,
	});

	await tusServer.handle(req, res);

	cleanupServer();
});

const router = Router();

router.post('/', checkFileAccess, handler);
router.patch('/:id', checkFileAccess, handler);
router.delete('/:id', checkFileAccess, handler);

router.options('/:id', checkFileAccess, handler);
router.head('/:id', checkFileAccess, handler);

export default router;
