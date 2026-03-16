import { flushCaches } from '../../../cache.js';
import { useLogger } from '../../../logger/index.js';

export default async function cacheClear(): Promise<void> {
	const logger = useLogger();

	try {
		await flushCaches(true);
		process.stdout.write('Cache cleared successfully\n');
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
