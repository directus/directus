import { beforeEach, expect, test } from 'vitest';
import type { NotNullViolationErrorExtensions } from './not-null-violation.js';
import { messageConstructor } from './not-null-violation.js';

let sample: NotNullViolationErrorExtensions;

beforeEach(() => {
	sample = {
		collection: 'test_collection',
		field: 'test_field',
	};
});

test('Constructs the message using the provided field name and collection', () => {
	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" in collection "${sample.collection}" can't be null.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" can't be null.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value in collection "${sample.collection}" can't be null.`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value can't be null.`);
});
