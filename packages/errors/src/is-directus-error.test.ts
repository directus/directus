import { createError } from './create-error.js';
import { isDirectusError } from './is-directus-error.js';
import { beforeEach, expect, test } from 'vitest';

let sample: {
	code: string;
	status: number;
	message: string;
};

beforeEach(() => {
	sample = {
		code: 'test_error',
		status: 400,
		message: 'Test error message',
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

test('Check against optional error code', () => {
	const SampleError = createError(sample.code, sample.message, sample.status);
	const error = new SampleError();
	expect(isDirectusError(error, sample.code)).toBe(true);
	expect(isDirectusError(error, 'different_code')).toBe(false);
});
