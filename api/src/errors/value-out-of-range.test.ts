import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { ValueOutOfRangeErrorExtensions } from './value-out-of-range.js';
import { messageConstructor } from './value-out-of-range.js';

let sample: ValueOutOfRangeErrorExtensions;

beforeEach(() => {
	sample = {
		collection: randomAlpha(randomInteger(2, 50)),
		field: randomAlpha(randomInteger(2, 50)),
	};
});

test('Constructs the message using the provided field name and collection', () => {
	const result = messageConstructor(sample);

	expect(result).toBe(
		`Numeric value for field "${sample.field}" in collection "${sample.collection}" is out of range.`
	);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value for field "${sample.field}" is out of range.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value in collection "${sample.collection}" is out of range.`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Numeric value is out of range.`);
});
