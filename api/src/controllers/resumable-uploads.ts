import type { Router } from "express";
import { scheduleSynchronizedJob, validateCron } from "../utils/schedule.js";
import { useEnv } from "@directus/env";
import { tusServer } from "../services/tus/index.js";
// import { ChunkedFilesService } from "../services/chunked-files.js";
import { AuthorizationService } from "../services/authorization.js";
import asyncHandler from "../utils/async-handler.js";

const env = useEnv();

export function registerTusEndpoints(router: Router) {
	const handler = tusServer.handle.bind(tusServer);

	const checkAccess = () => asyncHandler(async (req, _res, next) => {
		const auth = new AuthorizationService({
			accountability: req.accountability,
			schema: req.schema,
		});

		console.info('tus', req.accountability);
		await auth.checkAccess('create', 'directus_files');

		return next();
	});

	router.post('/tus', checkAccess(), handler);
	router.patch('/tus/:id', checkAccess(), handler);

	router.options('/tus/:id', checkAccess(), handler);
	router.head('/tus/:id', checkAccess(), handler);
}

const TUS_CLEANUP_CRON_RULE = (env['TUS_CLEANUP_CRON_RULE'] ?? '45 * * * *') as string;

export function scheduleTusCleanup() {
	if (validateCron(TUS_CLEANUP_CRON_RULE)) {
		scheduleSynchronizedJob('tus-cleanup', TUS_CLEANUP_CRON_RULE, async () => {
			await tusServer.cleanUpExpiredUploads();
		});
	}
}
