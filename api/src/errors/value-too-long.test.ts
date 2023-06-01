import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { messageConstructor } from './value-too-long.js';

let sample: {
	collection: string;
	field: string;
};

beforeEach(() => {
	sample = {
		collection: randomAlpha(randomInteger(2, 50)),
		field: randomAlpha(randomInteger(2, 50)),
	};
});

test('Constructs the message using the provided field name', () => {
	const result = messageConstructor(sample);
	expect(result).toBe(`Value for field "${sample.field}" in collection "${sample.collection}" is too long.`);
});
