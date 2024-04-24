import type { DirectusActivity } from '../../../schema/activity.js';
import type { RestCommand } from '../../types.js';

/**
 * Deletes a comment.
 * @param key
 * @returns Nothing
 */
export const deleteComment =
	<Schema>(key: DirectusActivity<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/activity/comment/${key}`,
		method: 'DELETE',
	});
