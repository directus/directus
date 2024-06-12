import type { Permission, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { validatePath } from './validate-path.js';
import { ForbiddenError } from '@directus/errors';

test('Throws if no permissions given for given collection', () => {
	const schema = {
		collections: {
			'test-collection': {},
		},
	} as unknown as SchemaOverview;

	expect(() => validatePath('test.path', [], 'test-collection', new Set(), schema)).toThrowError(ForbiddenError);
});

test('Throws if collection does not exist in the schema', () => {
	const schema = { collections: {} } as unknown as SchemaOverview;

	expect(() =>
		validatePath(
			'test.path',
			[{ collection: 'test-collection', fields: ['*'] } as Permission],
			'test-collection',
			new Set(),
			schema,
		),
	).toThrowError(ForbiddenError);
});

test('Throws if field is allowed but not present in the schema', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {},
			},
		},
	} as unknown as SchemaOverview;

	expect(() =>
		validatePath(
			'test.path',
			[{ collection: 'test-collection', fields: ['*'] } as Permission],
			'test-collection',
			new Set('test-field-a'),
			schema,
		),
	).toThrowError(ForbiddenError);
});

test('Returns without throwing if field set contains * and the collection and field is present in the schema', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {
					'test-field-b': {},
				},
			},
		},
	} as unknown as SchemaOverview;

	expect(() =>
		validatePath(
			'test.path',
			[{ collection: 'test-collection', fields: ['*'] } as Permission],
			'test-collection',
			new Set(['test-field-b']),
			schema,
		),
	).not.toThrow();
});

test('Throws if field is requested and present in schema but not allowed in permissions', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {
					'test-field-b': {},
				},
			},
		},
	} as unknown as SchemaOverview;

	expect(() =>
		validatePath(
			'test.path',
			[{ collection: 'test-collection', fields: ['test-field-a'] } as Permission],
			'test-collection',
			new Set(['test-field-b']),
			schema,
		),
	).toThrowError(ForbiddenError);
});

test('Throws if fields are requested and present in the schema but not allowed in permissions', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {
					'test-field-b': {},
					'test-field-c': {},
				},
			},
		},
	} as unknown as SchemaOverview;

	expect(() =>
		validatePath(
			'test.path',
			[{ collection: 'test-collection', fields: ['test-field-a'] } as Permission],
			'test-collection',
			new Set(['test-field-b', 'test-field-c']),
			schema,
		),
	).toThrowError(ForbiddenError);
});
