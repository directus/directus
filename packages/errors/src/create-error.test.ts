import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, test, expect, vi } from 'vitest';
import { createError } from './create-error.js';

let sample: {
	code: string;
	status: number;
	message: string;
	extensionKey: string;
	extensionValue: string;
};

beforeEach(() => {
	sample = {
		code: randomAlpha(randomInteger(1, 25)),
		status: randomInteger(200, 599),
		message: randomAlpha(randomInteger(10, 50)),
		extensionKey: randomAlpha(randomInteger(1, 10)),
		extensionValue: randomAlpha(randomInteger(1, 10)),
	};
});

test('Returns enhanced error object', () => {
	const TestError = createError(sample.code, sample.message, sample.status);
	const error = new TestError();

	expect(error.name).toBe('DirectusError');
	expect(error.code).toBe(sample.code.toUpperCase());
	expect(error.message).toBe(sample.message);
	expect(error.status).toBe(sample.status);
});

test('Allows passing message as callback function', () => {
	const TestError = createError(sample.code, () => sample.message, sample.status);
	const error = new TestError();
	expect(error.message).toBe(sample.message);
});

test('Passes extensions to custom message function', () => {
	const messageGenerator = vi.fn().mockReturnValue(sample.message);
	const extensions = { [sample.extensionKey]: sample.extensionValue };
	const TestError = createError<{ [key: string]: unknown }>(sample.code, messageGenerator, sample.status);

	new TestError(extensions);

	expect(messageGenerator).toHaveBeenCalledWith(extensions);
});

test('Makes extensions available', () => {
	const messageGenerator = vi.fn().mockReturnValue(sample.message);
	const extensions = { [sample.extensionKey]: sample.extensionValue };
	const TestError = createError<{ [key: string]: unknown }>(sample.code, messageGenerator, sample.status);

	const error = new TestError(extensions);

	expect(error.extensions).toBe(extensions);
});

test('Overrides toString', () => {
	const TestError = createError(sample.code, sample.message, sample.status);

	const error = new TestError();

	expect(error.toString()).toBe(`DirectusError [${sample.code.toUpperCase()}]: ${sample.message}`);
});
