import { InternalServerError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import config from './index.js';

const DEFAULT_ERROR = new InternalServerError();

describe('Operations / Throw Error', () => {
	test('Throws error with default values', () => {
		expect.assertions(3);

		try {
			config.handler({} as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe(DEFAULT_ERROR.code);
			expect(err.status).toBe(DEFAULT_ERROR.status);
			expect(err.message).toBe(DEFAULT_ERROR.message);
		}
	});

	test('Throws error with custom code', () => {
		expect.assertions(3);

		try {
			config.handler({ code: 'CUSTOM_ERROR' } as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe('CUSTOM_ERROR');
			expect(err.status).toBe(DEFAULT_ERROR.status);
			expect(err.message).toBe(DEFAULT_ERROR.message);
		}
	});

	test('Throws error with custom status', () => {
		expect.assertions(3);

		try {
			config.handler({ status: '404' } as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe(DEFAULT_ERROR.code);
			expect(err.status).toBe(404);
			expect(err.message).toBe('An unexpected error occurred.');
		}
	});

	test('Throws error with custom message', () => {
		expect.assertions(3);

		try {
			config.handler({ message: 'Something went wrong' } as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe(DEFAULT_ERROR.code);
			expect(err.status).toBe(500);
			expect(err.message).toBe('Something went wrong');
		}
	});

	test('Throws error with custom code, status, and message', () => {
		expect.assertions(3);

		try {
			config.handler({ code: 'CUSTOM_ERROR', status: '400', message: 'Bad request' } as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe('CUSTOM_ERROR');
			expect(err.status).toBe(400);
			expect(err.message).toBe('Bad request');
		}
	});

	test('Throws error with invalid status, falling back to default', () => {
		expect.assertions(3);

		try {
			config.handler({ status: 'invalid' } as any, {} as any);
		} catch (err: any) {
			expect(err.code).toBe(DEFAULT_ERROR.code);
			expect(err.status).toBe(DEFAULT_ERROR.status);
			expect(err.message).toBe(DEFAULT_ERROR.message);
		}
	});
});
