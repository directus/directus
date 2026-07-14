import { beforeEach, expect, test } from 'vitest';
import type { ImportCyclicalRelationErrorExtensions } from './import-cyclical-relation.js';
import { messageConstructor } from './import-cyclical-relation.js';

let sample: ImportCyclicalRelationErrorExtensions;

beforeEach(() => {
	sample = {
		collections: ['articles', 'authors'],
		relations: [
			{ collection: 'articles', field: 'author', related: 'authors' },
			{ collection: 'authors', field: 'featured_article', related: 'articles' },
		],
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(
		`Can't import collections [articles, authors] because they form a relational cycle with only non-nullable foreign keys.`,
	);
});
