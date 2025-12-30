import type { RecordNotUniqueErrorExtensions } from './record-not-unique.js';
import { messageConstructor } from './record-not-unique.js';
import { beforeEach, expect, test } from 'vitest';

let sample: RecordNotUniqueErrorExtensions;

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
		`Value "${sample.value}" for field "${sample.field}" in collection "${sample.collection}" has to be unique.`,
	);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" for field "${sample.field}" has to be unique.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" in collection "${sample.collection}" has to be unique.`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" has to be unique.`);
});

test('Constructs the message using without value', () => {
	sample.value = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" in collection "${sample.collection}" has to be unique.`);
});
