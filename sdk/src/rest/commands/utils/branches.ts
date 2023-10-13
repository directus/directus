import type { DirectusBranch } from '../../../schema/branch.js';
import type { UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Compare an existing branch with the main version of the item.
 *
 * @param id Primary key of the branch.
 *
 * @returns All fields with different values, along with the hash of the main version of the item and the information
whether the current branch is outdated (main version of the item has been updated since the creation of the branch)
 * @throws Will throw if ID is empty
 */
export const compareBranch =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusBranch<Schema>['id']
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
			path: `/branches/${id}/compare`,
			method: 'GET',
		};
	};

/**
 * Save item changes to an existing branch.
 *
 * @param id Primary key of the branch.
 * @param item The item changes to save in the specified branch.
 *
 * @returns Item object with the state after the save.
 * @throws Will throw if ID is empty
 */
export const saveToBranch =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusBranch<Schema>['id'],
		item: Partial<Item>
	): RestCommand<Item, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/branches/${id}/save`,
			method: 'POST',
			body: JSON.stringify(item),
		};
	};

/**
 * Promote an existing branch as new main version of the item.
 *
 * @param id Primary key of the branch.
 * @param mainHash mainHash Hash of the main version of the item (obtained from the `compare` endpoint).
 * @param fields Optional, array of field names of which the values are to be promoted. By default, all fields are selected.
 *
 * @returns The primary key of the promoted item.
 * @throws Will throw if ID is empty
 */
export const promoteBranch =
	<Schema extends object, Collection extends keyof Schema, Item = UnpackList<Schema[Collection]>>(
		id: DirectusBranch<Schema>['id'],
		mainHash: string,
		fields?: (keyof UnpackList<Item>)[]
	): RestCommand<string | number, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/branches/${id}/promote`,
			method: 'POST',
			body: JSON.stringify(fields ? { mainHash, fields } : { mainHash }),
		};
	};
