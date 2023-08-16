import type { DirectusShare } from '../../../schema/share.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing shares.
 * @param keys
 * @returns
 */
export const deleteShares =
	<Schema extends object>(keys: DirectusShare<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/shares`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing share.
 * @param key
 * @returns
 */
export const deleteShare =
	<Schema extends object>(key: DirectusShare<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/shares/${key}`,
		method: 'DELETE',
	});
