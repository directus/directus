import type { RestCommand } from '../../types.js';

/**
 * If a collection has a sort field, this util can be used to move items in that manual order.
 * @returns Nothing
 */
export const utilitySort =
	<Schema>(collection: keyof Schema, item: string, to: number): RestCommand<void, Schema> =>
	() => ({
		method: 'POST',
		path: `/utils/sort/${collection as string}`,
		body: JSON.stringify({ item, to }),
	});
