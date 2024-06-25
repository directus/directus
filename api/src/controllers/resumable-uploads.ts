import { Router } from "express";
import { scheduleSynchronizedJob, validateCron } from "../utils/schedule.js";
import { useEnv } from "@directus/env";
import { tusServer } from "../services/tus/index.js";
import { AuthorizationService } from "../services/authorization.js";
import asyncHandler from "../utils/async-handler.js";

const env = useEnv();

const handler = tusServer.handle.bind(tusServer);
const router = Router();

const checkAccess = () => asyncHandler(async (req, _res, next) => {
	// const auth = new AuthorizationService({
	// 	accountability: req.accountability,
	// 	schema: req.schema,
	// });

	console.info('tus', req.method/*, req.accountability, req.token*/);

	if (!req.accountability?.admin) {

		// fix this somehow?
		// await auth.checkAccess('create', 'directus_files');
	}

	return next();
});

router.post('/', checkAccess(), handler);
router.patch('/:id', checkAccess(), handler);

router.options('/:id', checkAccess(), handler);
router.head('/:id', checkAccess(), handler);

export const tusRouter = router;

const TUS_CLEANUP_CRON_RULE = (env['TUS_CLEANUP_CRON_RULE'] ?? '45 * * * *') as string;

export function scheduleTusCleanup() {
	if (validateCron(TUS_CLEANUP_CRON_RULE)) {
		scheduleSynchronizedJob('tus-cleanup', TUS_CLEANUP_CRON_RULE, async () => {
			await tusServer.cleanUpExpiredUploads();
		});
	}
}
