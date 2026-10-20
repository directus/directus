import { expect, test } from 'vitest';
import { disabledActions, getStoredUserOnlyActions, userOnlyActions } from './app-permissions';

test('groups the actions the API restricts to authenticated users by collection', () => {
	expect(userOnlyActions).toEqual({ directus_comments: ['create', 'delete', 'update'] });
});

test('keeps the admin-only and authenticated-only actions separate', () => {
	expect(disabledActions['directus_comments']).toBeUndefined();
	expect(userOnlyActions['directus_collections']).toBeUndefined();
});

test('returns only the restricted actions that have a stored permission', () => {
	expect(getStoredUserOnlyActions('directus_comments', [{ action: 'create' }, { action: 'read' }])).toEqual(['create']);
	expect(getStoredUserOnlyActions('directus_comments', [{ action: 'read' }])).toEqual([]);
	expect(getStoredUserOnlyActions('directus_files', [{ action: 'create' }])).toEqual([]);
});
