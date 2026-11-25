import { describe, expect, test } from 'vitest';
import { addToFieldMap, collectionsInFieldMap, createFieldMap, fieldMapEntries } from './field-map.js';

describe('addToFieldMap', () => {
	test.each(['action', 'read'] as const)('adds the field to the path in group %s', (group) => {
		const fieldMap = createFieldMap();

		addToFieldMap(fieldMap, group, ['author'], 'authors', 'name');
		addToFieldMap(fieldMap, group, ['author'], 'authors', 'email');

		expect(fieldMap[group]).toEqual(
			new Map([['author', { collection: 'authors', fields: new Set(['name', 'email']) }]]),
		);
	});

	test('adds the path without fields if no field is given', () => {
		const fieldMap = createFieldMap();

		addToFieldMap(fieldMap, 'action', ['comments'], 'comments');

		expect(fieldMap.action).toEqual(new Map([['comments', { collection: 'comments', fields: new Set() }]]));
	});

	test('keeps the collection of the existing path', () => {
		const fieldMap = createFieldMap();

		addToFieldMap(fieldMap, 'action', [], 'articles', 'title');
		addToFieldMap(fieldMap, 'action', [], 'other', 'body');

		expect(fieldMap.action.get('')).toEqual({ collection: 'articles', fields: new Set(['title', 'body']) });
	});
});

test('fieldMapEntries returns the entries of both groups', () => {
	const fieldMap = createFieldMap();

	addToFieldMap(fieldMap, 'action', [], 'articles', 'title');
	addToFieldMap(fieldMap, 'read', ['author'], 'authors', 'name');

	expect([...fieldMapEntries(fieldMap)]).toEqual([
		['author', { collection: 'authors', fields: new Set(['name']) }],
		['', { collection: 'articles', fields: new Set(['title']) }],
	]);
});

test('collectionsInFieldMap returns the collections of both groups', () => {
	const fieldMap = createFieldMap();

	addToFieldMap(fieldMap, 'action', ['author'], 'authors');
	addToFieldMap(fieldMap, 'read', [], 'articles');
	addToFieldMap(fieldMap, 'read', ['author'], 'authors');

	expect(collectionsInFieldMap(fieldMap)).toEqual(new Set(['articles', 'authors']));
});
