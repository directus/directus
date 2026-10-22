import { expect, test } from 'vitest';
import {
	disabledActions,
	getStoredDisabledActions,
	getStoredUserOnlyActions,
	userOnlyActions,
} from './app-permissions';

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

test('returns only the admin-only actions that have a stored permission', () => {
	expect(getStoredDisabledActions('directus_extensions', [{ action: 'update' }, { action: 'read' }])).toEqual([
		'update',
	]);

	expect(getStoredDisabledActions('directus_extensions', [{ action: 'read' }])).toEqual([]);
	expect(getStoredDisabledActions('directus_comments', [{ action: 'create' }])).toEqual([]);
});
