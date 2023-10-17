import type { Reference } from 'isolated-vm';
import env from '../../env.js';
import { handleIsolateError } from './handle-isolate-error.js';

export async function resumeIsolate(context: unknown, reference: Reference, args: any[]) {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	try {
		return await reference.apply(null, args, {
			timeout: scriptTimeoutMs,
			arguments: {
				copy: true,
			},
			result: {
				copy: true,
				promise: true,
			},
		});
	} catch (error: any) {
		handleIsolateError(context, error);
		return error;
	}
}
