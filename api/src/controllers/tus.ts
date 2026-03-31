import { createError } from '@directus/errors';
import type { PermissionsAction } from '@directus/types';
import { ERRORS, Metadata } from '@tus/utils';
import { Router } from 'express';
import getDatabase from '../database/index.js';
import { validateAccess, type ValidateAccessOptions } from '../permissions/modules/validate-access/validate-access.js';
import { createTusServer } from '../services/tus/index.js';
import asyncHandler from '../utils/async-handler.js';

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

		const validateAccessOptions: ValidateAccessOptions = {
			action,
			collection: 'directus_files',
			accountability: req.accountability,
		};

		if (req.method === 'POST' && req.header('upload-metadata')) {
			let metadata: Record<string, string | null>;

			try {
				metadata = Metadata.parse(req.header('upload-metadata'));
			} catch {
				throw new (createError(
					'INVALID_METADATA',
					ERRORS.INVALID_METADATA.body,
					ERRORS.INVALID_METADATA.status_code,
				))();
			}

			// On replacement ensure update for that record
			if (metadata['id']) {
				validateAccessOptions.action = 'update';
				validateAccessOptions.primaryKeys = [metadata['id']];
			}

			// Validate permissions for any payload fields
			const fields = [];

			for (const field of Object.keys(req.schema.collections['directus_files']!.fields)) {
				// PK is not mutable, access to record is already checked via `primaryKeys` for updates
				if (field === 'id') {
					continue;
				}

				if (field in metadata) {
					fields.push(field);
				}
			}

			if (fields.length > 0) {
				validateAccessOptions.fields = fields;
			}
		}

		await validateAccess(validateAccessOptions, {
			schema: req.schema,
			knex: getDatabase(),
		});
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
