import { formatFields } from '../index.js';
import type { RestCommand } from '../types.js';

export function withSearch<Schema extends object, Output>(
	getOptions: RestCommand<Output, Schema>,
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		if (options.method === 'GET' && options.params) {
			options.method = 'SEARCH';

			options.body = JSON.stringify({
				query: {
					...options.params,
					fields: formatFields(options.params['fields'] ?? []),
				},
			});

			delete options.params;
		}

		return options;
	};
}
