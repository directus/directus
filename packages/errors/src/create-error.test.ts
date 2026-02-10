import { beforeEach, expect, test, vi } from 'vitest';
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
		code: 'test_error',
		status: 400,
		message: 'Test error message',
		extensionKey: 'testKey',
		extensionValue: 'testValue',
	};
});

test('Returns enhanced error object', () => {
	const TestError = createError(sample.code, sample.message, sample.status);
	const error = new TestError();

	expect(error.name).toBe('DirectusError');
	expect(error.code).toBe('TEST_ERROR');
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
