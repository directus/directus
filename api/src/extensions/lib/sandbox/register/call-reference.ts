import { useEnv } from '@directus/env';
import type { Reference } from 'isolated-vm';
import { useLogger } from '../../../../logger/index.js';

type Args<T> = T extends (...args: infer Args) => unknown ? Args : any[];
type Result<T> = T extends (...args: any) => infer Result ? Result : unknown;

export async function callReference<T extends (...args: any[]) => unknown | Promise<unknown>>(
	fn: Reference<T>,
	args: Args<T>,
): Promise<Reference<Result<T>>> {
	const env = useEnv();
	const logger = useLogger();

	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	try {
		return await fn.apply(undefined, args, {
			arguments: { copy: true },
			result: { reference: true, promise: true },
			timeout: sandboxTimeout,
		});
	} catch (e) {
		if (e instanceof RangeError) {
			logger.error(`Extension sandbox has reached the memory limit`);
			logger.error(e);

			process.abort();
		}

		throw e;
	}
}
