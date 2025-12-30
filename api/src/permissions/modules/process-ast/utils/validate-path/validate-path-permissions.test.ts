import { validatePathPermissions } from './validate-path-permissions.js';
import { ForbiddenError } from '@directus/errors';
import type { Permission } from '@directus/types';
import { expect, test } from 'vitest';

test('Throws if no permissions given for given collection', () => {
	expect(() => validatePathPermissions('test.path', [], 'test-collection', new Set())).toThrowError(ForbiddenError);
});

test('Returns without throwing if permission fields contains*', () => {
	expect(() =>
		validatePathPermissions(
			'test.path',
			[{ collection: 'test-collection', fields: ['*'] } as Permission],
			'test-collection',
			new Set(['test-field-b']),
		),
	).not.toThrow();
});

test('Throws if field is requested but not allowed in permissions', () => {
	expect(() =>
		validatePathPermissions(
			'test.path',
			[{ collection: 'test-collection', fields: ['test-field-a'] } as Permission],
			'test-collection',
			new Set(['test-field-b']),
		),
	).toThrowError(ForbiddenError);
});

test('Throws if fields are requested but not allowed in permissions', () => {
	expect(() =>
		validatePathPermissions(
			'test.path',
			[{ collection: 'test-collection', fields: ['test-field-a'] } as Permission],
			'test-collection',
			new Set(['test-field-b', 'test-field-c']),
		),
	).toThrowError(ForbiddenError);
});
