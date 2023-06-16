import type { Query } from '../types/index.js';

export const queryToParams = <Schema extends object, Item extends object>(
	query: Query<Schema, Item>
): Record<string, string> => {
	const params: Record<string, string> = {};

	if (query.fields) {
		/** @todo expand for nested fields use */
		params['fields'] = query.fields.join(',');
	}

	return params;
};
