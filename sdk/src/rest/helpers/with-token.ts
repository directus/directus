import type { RestCommand } from '../types.js';

export function withToken<Schema extends object, Output>(
	token: string,
	getOptions: RestCommand<Output, Schema>,
): RestCommand<Output, Schema> {
	return () => {
		const options = getOptions();

		if (token) {
			if (!options.headers) options.headers = {};
			options.headers['Authorization'] = `Bearer ${token}`;
		}

		return options;
	};
}
