import type { RequestTransformer } from '../../index.js';
import type { RestCommand } from '../types.js';

/**
 * Add arbitrary options to a fetch request
 *
 * @param getOptions
 * @param onRequest
 *
 * @returns
 */
export function withOptions<Schema extends object, Output>(
	getOptions: RestCommand<Output, Schema>,
	onRequest: RequestTransformer | Partial<RequestInit>,
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		if (typeof onRequest === 'function') {
			options.onRequest = onRequest;
		} else {
			options.onRequest = (options) => ({
				...options,
				...onRequest,
			});
		}

		return options;
	};
}
