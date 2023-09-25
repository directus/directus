import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { messageConstructor } from './contains-null-values.js';

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
	expect(result).toBe(`Field "${sample.field}" in collection "${sample.collection}" contains null values.`);
});
