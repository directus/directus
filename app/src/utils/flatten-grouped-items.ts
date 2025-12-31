import { groupBy, isNil, orderBy } from 'lodash';

export interface FlattenGroupedItemsConfig<T, ID = string> {
	/** Extract the unique ID from an item */
	getId: (item: T) => ID;
	/** Get the parent/group ID for an item (null/undefined for root items) */
	getParent: (item: T) => ID | null | undefined;
	/** Get the sort value for an item (null if no sort) */
	getSort: (item: T) => number | null | undefined;
	/** Get the name/label for secondary sorting */
	getName: (item: T) => string;
}

/**
 * Create a flat list of items, in which grouped items are sorted under their parent.
 * Sorted by sort value first, then by name.
 *
 * item_a                item_a
 *   item_a_1            item_a_1
 *   item_a_2            item_a_2
 *     item_a_2_1   ->   item_a_2_1
 * item_b                item_b
 *   item_b_1            item_b_1
 *
 * @param items - Array of items to flatten
 * @param config - Configuration for ID, parent, sort, and name extraction
 */
export function flattenGroupedItems<T, ID = string>(items: T[], config: FlattenGroupedItemsConfig<T, ID>): T[] {
	const topLevelItems = items.filter((item) => isNil(config.getParent(item)));

	const groupedItems = groupBy(
		items.filter((item) => !isNil(config.getParent(item))),
		(item) => config.getParent(item),
	);

	const flatten = (itemsToFlatten: T[]): T[] => {
		const result: T[] = [];

		const sorted = orderBy(
			itemsToFlatten,
			[(item) => config.getSort(item) ?? Infinity, (item) => config.getName(item)],
			['asc', 'asc'],
		);

		for (const item of sorted) {
			result.push(item);

			const id = config.getId(item) as unknown as string;

			if (groupedItems[id]) {
				result.push(...flatten(groupedItems[id]!));
			}
		}

		return result;
	};

	return flatten(topLevelItems);
}
