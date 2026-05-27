import { RESUMABLE_UPLOADS } from '../constants.js';
import { createTusServer } from '../services/tus/index.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

/**
 * Schedule the tus cleanup
 *
 * @returns Whether or not tus cleanup has been initialized
 */
export default async function schedule(): Promise<boolean> {
	if (!RESUMABLE_UPLOADS.ENABLED) return false;

	if (validateCron(RESUMABLE_UPLOADS.SCHEDULE)) {
		scheduleSynchronizedJob('tus-cleanup', RESUMABLE_UPLOADS.SCHEDULE, async () => {
			const [tusServer, cleanupServer] = await createTusServer({
				schema: await getSchema(),
			});

			await tusServer.cleanUpExpiredUploads();

			cleanupServer();
		});
	}

	return true;
}
