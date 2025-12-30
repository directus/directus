import type { InvalidForeignKeyErrorExtensions } from './invalid-foreign-key.js';
import { messageConstructor } from './invalid-foreign-key.js';
import { beforeEach, expect, test } from 'vitest';

let sample: InvalidForeignKeyErrorExtensions;

beforeEach(() => {
	sample = {
		collection: 'test_collection',
		field: 'test_field',
		value: 'test_value',
	};
});

test('Constructs the message using the provided field name and collection', () => {
	const result = messageConstructor(sample);

	expect(result).toBe(
		`Invalid foreign key "${sample.value}" for field "${sample.field}" in collection "${sample.collection}".`,
	);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key "${sample.value}" for field "${sample.field}".`);
});

test('Constructs the message using the provided collection name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key "${sample.value}" in collection "${sample.collection}".`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key "${sample.value}".`);
});

test('Constructs the message without the key', () => {
	sample.value = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Invalid foreign key for field "${sample.field}" in collection "${sample.collection}".`);
});
