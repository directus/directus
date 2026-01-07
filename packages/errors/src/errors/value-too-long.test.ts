import { beforeEach, expect, test } from 'vitest';
import type { ValueTooLongErrorExtensions } from './value-too-long.js';
import { messageConstructor } from './value-too-long.js';

let sample: ValueTooLongErrorExtensions;

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
		`Value "${sample.value}" for field "${sample.field}" in collection "${sample.collection}" is too long.`,
	);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" for field "${sample.field}" is too long.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" in collection "${sample.collection}" is too long.`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value "${sample.value}" is too long.`);
});

test('Constructs the message using without value', () => {
	sample.value = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" in collection "${sample.collection}" is too long.`);
});
