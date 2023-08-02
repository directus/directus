import type { RestCommand } from '../types.js';

export function asSearch<Schema extends object, Output>(
	getOptions: RestCommand<Output, Schema>
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		if (options.method === 'GET') {
			options.method = 'SEARCH';
			options.body = JSON.stringify({ query: options.params });
			delete options.params;
		}

		return options;
	};
}
