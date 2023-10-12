import type { DirectusVersion } from '../../../schema/version.js';
import type { UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Compare an existing version with the main item.
 *
 * @param id Primary key of the version.
 *
 * @returns All fields with different values, along with the hash of the main item and the information whether the current
version is outdated (main item has been updated since the creation of the current version)
 */
export const compareContentVersion =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id']
	): RestCommand<
		{
			outdated: boolean;
			mainHash: string;
			current: Partial<Item>;
			main: Item;
		},
		Schema
	> =>
	() => ({
		path: `/versions/${id}/compare`,
		method: 'GET',
	});

/**
 * Saves new data to the item in the specified version.
 *
 * @param id Primary key of the version.
 * @param item The item data to save in the specified version.
 *
 * @returns Item object resulted from all saves in the specified version.
 */
export const saveContentVersion =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id'],
		item: Partial<Item>
	): RestCommand<Item, Schema> =>
	() => ({
		path: `/versions/${id}/save`,
		method: 'POST',
		body: JSON.stringify(item),
	});

/**
 * Promotes the version to the main version.
 *
 * @param id Primary key of the version.
 * @param mainHash mainHash from Compare Version Object.
 * @param fields Optional - fields to include when promoting the version. Includes all fields by default if not specified.
 *
 * @returns The primary key of the promoted item.
 */
export const promoteContentVersion =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusVersion<Schema>['id'],
		mainHash: string,
		fields?: (keyof UnpackList<Item>)[]
	): RestCommand<string | number, Schema> =>
	() => ({
		path: `/versions/${id}/promote`,
		method: 'POST',
		body: JSON.stringify(fields ? { mainHash, fields } : { mainHash }),
	});
