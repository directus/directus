import pLimit from 'p-limit';
import { useLogger } from '../../logger/index.js';

export const MAX_CONCURRENT_COLLECTORS = 4;

const limit = pLimit(MAX_CONCURRENT_COLLECTORS);

export async function safeCollect<T>(name: string, collect: () => Promise<T>): Promise<T | null> {
	return limit(async () => {
		try {
			return await collect();
		} catch (error) {
			useLogger().warn(error, `Telemetry collector "${name}" failed, omitting it from the report`);
			return null;
		}
	});
}
