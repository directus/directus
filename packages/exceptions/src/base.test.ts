import { vi, test, expect, afterEach, beforeEach } from 'vitest';
import { randSentence, randNumber, randWord } from '@ngneat/falso';
import { BaseException } from './base.js';

let sample: {
	message: string;
	status: number;
	code: string;
	extensions: Record<string, unknown>;
};

beforeEach(() => {
	sample = {
		message: randSentence(),
		status: randNumber({ min: 400, max: 599 }),
		code: randWord(),
		extensions: {},
	};
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Extends default Error', () => {
	const err = new BaseException(sample.message, sample.status, sample.code);
	expect(err).toBeInstanceOf(Error);
});

test('Sets passed message as property', () => {
	const err = new BaseException(sample.message, sample.status, sample.code);
	expect(err.message).toBe(sample.message);
});

test('Sets passed status as property', () => {
	const err = new BaseException(sample.message, sample.status, sample.code);
	expect(err.status).toBe(sample.status);
});

test('Sets passed code as property', () => {
	const err = new BaseException(sample.message, sample.status, sample.code);
	expect(err.code).toBe(sample.code);
});

test('Optionally sets extensions', () => {
	const err = new BaseException(sample.message, sample.status, sample.code, sample.extensions);
	expect(err.extensions).toBe(sample.extensions);
});
