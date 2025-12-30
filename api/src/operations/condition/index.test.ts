import config from './index.js';
import { describe, expect, test } from 'vitest';

describe('Operations / Condition', () => {
	test('returns null when condition passes', () => {
		const filter = {
			status: {
				_eq: true,
			},
		};

		const data = {
			status: true,
		};

		expect(config.handler({ filter }, { data } as any)).toBe(null);
	});

	test('throws error array when conditions fails', () => {
		const filter = {
			status: {
				_eq: true,
			},
		};

		const data = {
			status: false,
		};

		expect.assertions(2); // ensure catch block is reached

		try {
			config.handler({ filter }, { data } as any);
		} catch (err: any) {
			expect(err).toHaveLength(1);
			expect(err[0]!.message).toBe(`Validation failed for field "status". Value has to be "true".`);
		}
	});

	test('throws error array when condition is checking for a field that is not included in data', () => {
		const filter = {
			status: {
				_eq: true,
			},
		};

		const data = {};

		expect.assertions(2); // ensure catch block is reached

		try {
			config.handler({ filter }, { data } as any);
		} catch (err: any) {
			expect(err).toHaveLength(1);
			expect(err[0]!.message).toBe(`Validation failed for field "status". Value is required.`);
		}
	});

	test('proper parsing of filter', () => {
		const filter = {
			status: {
				_eq: true,
			},
			other: {
				_eq: 'Other',
			},
		};

		const data = {};

		expect.assertions(3); // ensure catch block is reached

		try {
			config.handler({ filter }, { data } as any);
		} catch (err: any) {
			expect(err).toHaveLength(2);
			expect(err[0]!.message).toBe(`Validation failed for field "status". Value is required.`);
			expect(err[1]!.message).toBe(`Validation failed for field "other". Value is required.`);
		}
	});
});
