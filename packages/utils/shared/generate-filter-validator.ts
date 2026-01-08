import type { Filter } from '@directus/types';
import { deepMapFilter } from './deep-map-filter.js';
import type { SchemaOverview } from '@directus/types';

export function generateFilterValidator(filter: Filter, collection: string, schema: SchemaOverview) {
	return deepMapFilter(
		filter,
		([key, value], context) => {
			return [key, value];
		},
		{
			collection,
			schema,
		},
	);
}
