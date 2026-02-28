import type { Field } from '@directus/types';
import { expect, test } from 'vitest';
import { sanitizeExportFieldSelection } from './export-sidebar-detail.utils';

const collectionFields = [
	{
		collection: 'articles',
		field: 'id',
		type: 'integer',
		name: 'ID',
	},
	{
		collection: 'articles',
		field: 'title',
		type: 'string',
		name: 'Title',
	},
	{
		collection: 'articles',
		field: 'translations',
		type: 'alias',
		name: 'Translations',
		meta: {
			special: ['translations'],
		},
	},
	{
		collection: 'articles',
		field: 'blocks',
		type: 'alias',
		name: 'Blocks',
		meta: {
			special: ['m2a'],
		},
	},
] as Field[];

test('removes direct alias fields from export selection', () => {
	expect(sanitizeExportFieldSelection(['id', 'translations', 'title'], collectionFields)).toEqual(['id', 'title']);
});

test('removes nested alias paths from export selection', () => {
	expect(sanitizeExportFieldSelection(['id', 'blocks.heading', 'blocks:quote.body'], collectionFields)).toEqual(['id']);
});

test('keeps selected fields when collection fields are unavailable', () => {
	expect(sanitizeExportFieldSelection(['id', 'translations'], undefined)).toEqual(['id', 'translations']);
});
