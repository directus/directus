import type { DirectusVersion } from '../../../schema/version.js';
import type { UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Save item changes to an existing Content Version.
 *
 * @param id Primary key of the Content Version.
 * @param item The item changes to save to the specified Content Version.
 *
 * @returns State of the item after save.
 */
export const saveToContentVersion =
	<Schema, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id'],
		item: Partial<Item>,
	): RestCommand<Item, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/versions/${id}/save`,
			method: 'POST',
			body: JSON.stringify(item),
		};
	};

/**
 * Compare an existing Content Version with the main version of the item.
 *
 * @param id Primary key of the Content Version.
 *
 * @returns All fields with different values, along with the hash of the main version of the item and the information
whether the Content Version is outdated (i.e. main version of the item has been updated since the creation of the
Content Version)
 */
export const compareContentVersion =
	<Schema, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id'],
	): RestCommand<
		{
			outdated: boolean;
			mainHash: string;
			current: Partial<Item>;
			main: Item;
		},
		Schema
	> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/versions/${id}/compare`,
			method: 'GET',
		};
	};

/**
 * Promote an existing Content Version to become the new main version of the item.
 *
 * @param id Primary key of the version.
 * @param mainHash The current hash of the main version of the item (obtained from the `compare` endpoint).
 * @param fields Optional array of field names of which the values are to be promoted. By default, all fields are selected.
 *
 * @returns The primary key of the promoted item.
 */
export const promoteContentVersion =
	<Schema, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id'],
		mainHash: string,
		fields?: (keyof UnpackList<Item>)[],
	): RestCommand<string | number, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/versions/${id}/promote`,
			method: 'POST',
			body: JSON.stringify(fields ? { mainHash, fields } : { mainHash }),
		};
	};
