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
	extraOptions: RequestTransformer | Partial<RequestInit>,
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		if (typeof extraOptions === 'function') {
			options.onRequest = extraOptions;
		} else {
			options.onRequest = (options) => ({
				...options,
				...extraOptions,
			});
		}

		return options;
	};
}
