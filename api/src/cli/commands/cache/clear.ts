import { useEnv } from '@directus/env';
import { flushCaches } from '../../../cache.js';
import { useLogger } from '../../../logger/index.js';

export default async function cacheClear(): Promise<void> {
	const env = useEnv();
	const logger = useLogger();

	if (env['CACHE_STORE'] !== 'redis') {
		process.stdout.write(
			'CACHE_STORE is not set to "redis". In-memory caches are local to each running process and cannot be cleared externally.\n',
		);

		process.exit(0);
	}

	try {
		await flushCaches(true);
		process.stdout.write('Cache cleared successfully\n');
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
