import { ForbiddenError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { validatePathExistence } from './validate-path-existence.js';

test('Throws if collection does not exist in the schema', () => {
	const schema = { collections: {} } as unknown as SchemaOverview;

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(), schema)).toThrowError(ForbiddenError);
});

test('Throws if field is not present in the schema', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {},
			},
		},
	} as unknown as SchemaOverview;

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['test-field-a']), schema)).toThrowError(
		ForbiddenError,
	);
});

test('Throws if fields are not present in the schema', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {},
			},
		},
	} as unknown as SchemaOverview;

	expect(() =>
		validatePathExistence('test.path', 'test-collection', new Set(['test-field-a', 'test-field-b']), schema),
	).toThrowError(ForbiddenError);
});

test('Returns without throwing an error if the field is present in the schema', () => {
	const schema = {
		collections: {
			'test-collection': {
				fields: {
					'test-field-a': {},
				},
			},
		},
	} as unknown as SchemaOverview;

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['test-field-a']), schema)).not.toThrow();
});
