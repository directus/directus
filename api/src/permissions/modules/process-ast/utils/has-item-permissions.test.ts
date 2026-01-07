import type { Permission } from '@directus/types';
import { expect, test } from 'vitest';
import { hasItemPermissions } from './has-item-permissions.js';

test('Returns false if permissions are null', () => {
	expect(hasItemPermissions({ permissions: null } as unknown as Permission)).toBe(false);
});

test('Returns false if permissions are empty object', () => {
	expect(hasItemPermissions({ permissions: {} } as unknown as Permission)).toBe(false);
});

test('Returns false if permissions are object with 1 or more keys', () => {
	expect(hasItemPermissions({ permissions: { status: { _eq: 'published' } } } as unknown as Permission)).toBe(true);
});
