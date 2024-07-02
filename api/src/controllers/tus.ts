import { Router } from 'express';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { createTusServer } from '../services/tus/index.js';
import { AuthorizationService } from '../services/authorization.js';
import asyncHandler from '../utils/async-handler.js';
import type { PermissionsAction } from '@directus/types';
import { ForbiddenError } from '@directus/errors';
import { RESUMABLE_UPLOADS } from '../constants.js';

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
	const auth = new AuthorizationService({
		accountability: req.accountability,
		schema: req.schema,
	});

	if (!req.accountability?.admin) {
		const action = mapAction(req.method);

		if (action === 'create') {
			// checkAccess doesnt seem to work as expected for "create" actions
			const hasPermission = Boolean(
				req.accountability?.permissions?.find((permission) => {
					return permission.collection === 'directus_files' && permission.action === action;
				}),
			);

			if (!hasPermission) throw new ForbiddenError();
		} else {
			try {
				await auth.checkAccess(action, 'directus_files');
			} catch (e) {
				throw new ForbiddenError();
			}
		}
	}

	return next();
});

const handler = asyncHandler(async (req, res) => {
	const tusServer = await createTusServer({
		schema: req.schema,
		accountability: req.accountability,
	});

	await tusServer.handle(req, res);
});

export function scheduleTusCleanup() {
	if (!RESUMABLE_UPLOADS.ENABLED) return;

	if (validateCron(RESUMABLE_UPLOADS.SCHEDULE)) {
		scheduleSynchronizedJob('tus-cleanup', RESUMABLE_UPLOADS.SCHEDULE, async () => {
			const tusServer = await createTusServer({
				schema: await getSchema(),
			});

			await tusServer.cleanUpExpiredUploads();
		});
	}
}

const router = Router();

router.post('/', checkFileAccess, handler);
router.patch('/:id', checkFileAccess, handler);
router.delete('/:id', checkFileAccess, handler);

router.options('/:id', checkFileAccess, handler);
router.head('/:id', checkFileAccess, handler);

export default router;
