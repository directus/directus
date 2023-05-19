import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { createError } from './create-error.js';
import { isDirectusError } from './is-directus-error.js';

let sample: {
	code: string;
	status: number;
	message: string;
};

beforeEach(() => {
	sample = {
		code: randomAlpha(randomInteger(5, 25)),
		status: randomInteger(200, 599),
		message: randomAlpha(randomInteger(10, 50)),
	};
});

test('Reports false for non Directus-errors', () => {
	const negative = [
		false,
		() => {
			/* empty */
		},
		[],
		new Error(),
		0,
		null,
		undefined,
		new Set(),
	];

	for (const input of negative) {
		expect(isDirectusError(input)).toBe(false);
	}
});

test('Reports true for Directus error', () => {
	const SampleError = createError(sample.code, sample.message, sample.status);
	const error = new SampleError();
	expect(isDirectusError(error)).toBe(true);
});
