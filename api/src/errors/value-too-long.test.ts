import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { ValueTooLongErrorExtensions } from './value-too-long.js';
import { messageConstructor } from './value-too-long.js';

let sample: ValueTooLongErrorExtensions;

beforeEach(() => {
	sample = {
		collection: randomAlpha(randomInteger(2, 50)),
		field: randomAlpha(randomInteger(2, 50)),
	};
});

test('Constructs the message using the provided field name and collection', () => {
	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" in collection "${sample.collection}" is too long.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.collection = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" is too long.`);
});

test('Constructs the message using the provided field name only', () => {
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value in collection "${sample.collection}" is too long.`);
});

test('Constructs the message using without field/collection', () => {
	sample.collection = null;
	sample.field = null;

	const result = messageConstructor(sample);
	expect(result).toBe(`Value is too long.`);
});
