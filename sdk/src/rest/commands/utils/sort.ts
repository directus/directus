import type { RestCommand } from '../../types.js';

/**
 * If a collection has a sort field, this util can be used to move items in that manual order.
 * @param collection The collection to sort
 * @param item Id of the item to move
 * @param to Id of the item to move to
 * @returns Nothing
 */
export const utilitySort =
	<Schema>(collection: keyof Schema, item: string | number, to: string | number): RestCommand<void, Schema> =>
	() => ({
		method: 'POST',
		path: `/utils/sort/${collection as string}`,
		body: JSON.stringify({ item, to }),
	});
