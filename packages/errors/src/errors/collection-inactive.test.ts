import { beforeEach, expect, test } from 'vitest';
import type { CollectionInactiveErrorExtensions } from './collection-inactive.js';
import { messageConstructor } from './collection-inactive.js';

let sample: CollectionInactiveErrorExtensions;

beforeEach(() => {
	sample = {
		collection: 'articles',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Collection "articles" is inactive.`);
});
