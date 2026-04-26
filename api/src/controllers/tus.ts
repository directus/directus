import { createError } from '@directus/errors';
import type { PermissionsAction } from '@directus/types';
import { ERRORS, Metadata } from '@tus/utils';
import { Router } from 'express';
import getDatabase from '../database/index.js';
import { validateAccess, type ValidateAccessOptions } from '../permissions/modules/validate-access/validate-access.js';
import { createTusServer } from '../services/tus/index.js';
import asyncHandler from '../utils/async-handler.js';

const checkFileAccess = asyncHandler(async (req, _res, next) => {
	if (req.accountability) {
		let action: PermissionsAction;

		// Determine the required permission action.
		// PATCH in the TUS protocol is used to upload subsequent chunks, NOT to modify the file
		// record — so "create" permission is sufficient for new uploads. We only require "update"
		// when the PATCH is completing a file replacement (an existing file whose tus_id matches
		// this upload ID). (#26877)
		if (req.method === 'PATCH' && req.params['id']) {
			const knex = getDatabase();
			const file = await knex('directus_files').where({ tus_id: req.params['id'] }).first(['uploaded_on']);
			// If the file was previously fully uploaded (uploaded_on is set), this is a replacement
			action = file?.uploaded_on ? 'update' : 'create';
		} else {
			switch (req.method) {
				case 'POST':
					action = 'create';
					break;
				case 'DELETE':
					action = 'delete';
					break;
				default:
					action = 'read';
			}
		}

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
