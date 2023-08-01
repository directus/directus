import type { DirectusPanel } from '../../../schema/panel.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing panels.
 * @param keys
 * @returns
 */
export const deletePanels =
	<Schema extends object>(keys: DirectusPanel<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/panels`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing panel.
 * @param key
 * @returns
 */
export const deletePanel =
	<Schema extends object>(key: DirectusPanel<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/panels/${key}`,
		method: 'DELETE',
	});
