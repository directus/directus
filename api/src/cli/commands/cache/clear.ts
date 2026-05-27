import { useEnv } from '@directus/env';
import { clearSystemCache, getCache } from '../../../cache.js';
import { useLogger } from '../../../logger/index.js';

export default async function cacheClear({ system, data }: { system?: boolean; data?: boolean }): Promise<void> {
	const env = useEnv();
	const logger = useLogger();

	if (env['CACHE_STORE'] !== 'redis') {
		process.stdout.write(
			'CACHE_STORE is not set to "redis". In-memory caches are local to each running process and cannot be cleared externally.\n',
		);

		process.exit(0);
	} else {
		const clearAll = !system && !data;

		try {
			if (clearAll || system) {
				await clearSystemCache({ forced: true });
			}

			if (clearAll || data) {
				const { cache } = getCache();
				await cache?.clear();
			}

			const target = clearAll
				? 'all caches'
				: [system && 'system cache', data && 'data cache'].filter(Boolean).join(' and ');

			process.stdout.write(`Cleared ${target} successfully\n`);
			process.exit(0);
		} catch (err: any) {
			logger.error(err);
			process.exit(1);
		}
	}
}
