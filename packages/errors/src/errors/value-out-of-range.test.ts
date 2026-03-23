import { expect, test } from 'vitest';
import type { ValueOutOfRangeErrorExtensions } from './value-out-of-range.js';
import { messageConstructor } from './value-out-of-range.js';

test('Constructs the message using the provided field name and collection', () => {
	const sample: ValueOutOfRangeErrorExtensions = {
		collection: 'test_collection',
		field: 'test_field',
		value: '12345',
	};

	const result = messageConstructor(sample);

	expect(result).toBe(`Numeric value "12345" for field "test_field" in collection "test_collection" is out of range.`);
});

test('Constructs the message using the provided field name only', () => {
	const sample: ValueOutOfRangeErrorExtensions = {
		collection: null,
		field: 'test_field',
		value: '12345',
	};

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value "12345" for field "test_field" is out of range.`);
});

test('Constructs the message using the provided collection only', () => {
	const sample: ValueOutOfRangeErrorExtensions = {
		collection: 'test_collection',
		field: null,
		value: '12345',
	};

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value "12345" in collection "test_collection" is out of range.`);
});

test('Constructs the message using without field/collection', () => {
	const sample: ValueOutOfRangeErrorExtensions = {
		collection: null,
		field: null,
		value: '12345',
	};

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value "12345" is out of range.`);
});

test('Constructs the message using without value', () => {
	const sample: ValueOutOfRangeErrorExtensions = {
		collection: 'test_collection',
		field: 'test_field',
		value: null,
	};

	const result = messageConstructor(sample);

	expect(result).toBe(`Numeric value for field "test_field" in collection "test_collection" is out of range.`);
});
