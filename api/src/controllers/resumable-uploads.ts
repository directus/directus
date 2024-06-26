import { Router } from "express";
import { scheduleSynchronizedJob, validateCron } from "../utils/schedule.js";
import { useEnv } from "@directus/env";
import { tusServer } from "../services/tus/index.js";
import { AuthorizationService } from "../services/authorization.js";
import asyncHandler from "../utils/async-handler.js";
import type { PermissionsAction } from "@directus/types";
import { ForbiddenError } from "@directus/errors";

const env = useEnv();

const handler = tusServer.handle.bind(tusServer);
const router = Router();

const mapAction = (method: string): PermissionsAction => {
	switch (method) {
		case 'POST': return 'create';
		case 'PATCH': return 'update';
		case 'DELETE': return 'delete';
		default: return 'read';
	}
}

const checkFileAccess = () => asyncHandler(async (req, _res, next) => {
	const auth = new AuthorizationService({
		accountability: req.accountability,
		schema: req.schema,
	});

	if (!req.accountability?.admin) {
		const action = mapAction(req.method);

		if (action === 'create') {
			// checkAccess doesnt seem to work as expected for "create" actions
			const hasPermission = Boolean(req.accountability?.permissions?.find((permission) => {
				return permission.collection === 'directus_files' && permission.action === action;
			}));

			if (!hasPermission) throw new ForbiddenError();
		} else {
			try {
				await auth.checkAccess(action, 'directus_files');
			} catch(e) {
				throw new ForbiddenError();
			}
		}
	}

	return next();
});

router.post('/', checkFileAccess(), handler);
router.patch('/:id', checkFileAccess(), handler);
router.delete('/:id', checkFileAccess(), handler);

router.options('/:id', checkFileAccess(), handler);

router.head('/:id', checkFileAccess(), handler,/*async (req, res) => {
	const context = createTusContext(req);
	const handler2 = new HeadHandler(tusServer.datastore, tusServer.options);

	await handler2.send(req, res, context).catch((err) => {
		res.status(err.status_code);
		res.send(err.body);
	})

	return res;
}*/);

export const tusRouter = router;

const TUS_CLEANUP_CRON_RULE = (env['TUS_CLEANUP_CRON_RULE'] ?? '45 * * * *') as string;

export function scheduleTusCleanup() {
	if (validateCron(TUS_CLEANUP_CRON_RULE)) {
		scheduleSynchronizedJob('tus-cleanup', TUS_CLEANUP_CRON_RULE, async () => {
			await tusServer.cleanUpExpiredUploads();
		});
	}
}
