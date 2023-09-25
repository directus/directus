import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { InvalidForeignKeyErrorExtensions } from './invalid-foreign-key.js';
import { messageConstructor } from './invalid-foreign-key.js';

let sample: InvalidForeignKeyErrorExtensions;

beforeEach(() => {
	sample = {
		collection: randomAlpha(randomInteger(2, 50)),
		field: randomAlpha(randomInteger(2, 50)),
	};
});

test('Constructs the message using the provided field name and collection', () => {
	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key for field "${sample.field}" in collection "${sample.collection}".`);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key for field "${sample.field}".`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key in collection "${sample.collection}".`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key.`);
});
