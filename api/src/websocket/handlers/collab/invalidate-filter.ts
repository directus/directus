import type { Filter, SchemaOverview } from '@directus/types';
import { deepMapFilter } from '../../../utils/deep-map-filter.js';
import { isObject } from 'lodash-es';
import emitter from '../../../emitter.js';

export function invalidateFilter(
	filter: Filter,
	collection: string,
	schema: SchemaOverview,
	invalidate: () => void,
): void {
	const deps: Record<string, Record<string, string[]>> = {};

	deepMapFilter(
		filter,
		([_key, value], context) => {
			if (context.field) {
				deps[context.collection.collection] = deps[context.collection.collection] ?? {};

				if (context.leaf) {
					deps[context.collection.collection]![context.field.field] =
						deps[context.collection.collection]![context.field.field] ?? [];

					// TODO: Currently doesn't handle all operators or dynamic values like $CURRENT_USER

					if (!isObject(value)) {
						deps[context.collection.collection]![context.field.field]!.push(value as string);
						return undefined;
					}

					const operation = Object.keys(value as Record<string, unknown>)[0];

					if (operation === '_in') {
						deps[context.collection.collection]![context.field.field]!.push(...(value as any)['_in']);
					} else if (operation === '_eq') {
						deps[context.collection.collection]![context.field.field]!.push((value as any)['_eq']);
					}
				} else {
					deps[context.collection.collection]![context.field.field] = [];
				}
			}

			return undefined;
		},
		{ collection, schema },
	);

	if (Object.keys(deps).length === 0) return;

	for (const coll of Object.keys(deps)) {
		emitter.onAction(`${coll}.items.update`, () => {
			invalidate();
		});

		emitter.onAction(`${coll}.items.delete`, () => {
			invalidate();
		});
	}
}
