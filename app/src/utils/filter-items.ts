import { FieldFilter, Filter, Item } from '@directus/types';
import { generateJoi } from '@directus/utils';

type Predicate = (item: Item) => boolean;

const PASSES: Predicate = () => true;
const FAILS: Predicate = () => false;

/**
 * Filters an in-memory list of items using the same Filter syntax the API uses for database
 * queries. Useful for views that already hold their data client-side (e.g. the flows list) and so
 * can't push the filter down to an API query.
 *
 * Rules that reach into a relation (e.g. `{ folder: { name: { _eq: 'x' } } }`) only match when the
 * item carries the related object rather than its foreign key, since there's nothing to join
 * against here. Callers that want those rules to work should hydrate the relation first.
 */
export function filterItems<T extends Item>(items: T[], filter: Filter | null): T[] {
	if (!filter) {
		return items;
	}

	const passes = compileFilter(filter);

	return items.filter((item) => passes(item));
}

function compileFilter(filter: Filter): Predicate {
	if (!filter || Object.keys(filter).length === 0) {
		return PASSES;
	}

	const key = Object.keys(filter)[0]!;

	if (key === '_and') {
		const predicates = (Object.values(filter)[0] as Filter[]).map(compileFilter);
		return (item) => predicates.every((passes) => passes(item));
	}

	if (key === '_or') {
		const predicates = (Object.values(filter)[0] as Filter[]).map(compileFilter);
		return (item) => predicates.some((passes) => passes(item));
	}

	let schema;

	try {
		schema = generateJoi(filter as FieldFilter);
	} catch {
		// Unsupported leaf (e.g. _json)
		return FAILS;
	}

	return (item) => {
		try {
			return schema.validate(item).error === undefined;
		} catch {
			// A path the item doesn't carry
			return false;
		}
	};
}
