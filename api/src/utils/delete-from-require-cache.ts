import { createRequire } from 'node:module';
import { useLogger } from '../logger/index.js';

const require = createRequire(import.meta.url);

export function deleteFromRequireCache(modulePath: string): void {
	const logger = useLogger();

	try {
		const moduleCachePath = require.resolve(modulePath);
		delete require.cache[moduleCachePath];
	} catch {
		logger.trace(`Module cache not found for ${modulePath}, skipped cache delete.`);
	}
}
