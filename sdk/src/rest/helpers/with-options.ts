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
	onRequest: RequestTransformer,
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		options.onRequest = onRequest;

		return options;
	};
}
