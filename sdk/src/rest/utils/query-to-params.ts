import type { Query } from '../../types/index.js';

export const queryToParams = (query: Query<any>): Record<string, string> => {
	const params: Record<string, string> = {};

	if (query.fields) {
		/** @todo expand for nested fields use */
		params['fields'] = query.fields.join(',');
	}

	return params;
};
