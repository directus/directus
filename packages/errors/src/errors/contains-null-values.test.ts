import { messageConstructor } from './contains-null-values.js';
import { beforeEach, expect, test } from 'vitest';

let sample: {
	collection: string;
	field: string;
};

beforeEach(() => {
	sample = {
		collection: 'test_collection',
		field: 'test_field',
	};
});

test('Constructs the message using the provided field name', () => {
	const result = messageConstructor(sample);
	expect(result).toBe(`Field "${sample.field}" in collection "${sample.collection}" contains null values.`);
});
