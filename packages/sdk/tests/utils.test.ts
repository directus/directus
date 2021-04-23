/**
 * @jest-environment node
 */

import { Debouncer } from '../src/utils';
import { timers } from './utils';

describe('debouncer', function () {
	test(`concurrent calls should return with the error from the first call`, async () => {
		await timers(async ({ tick }) => {
			let calls = 0;

			const debouncer = new Debouncer(async (value) => {
				return new Promise((resolve) =>
					setTimeout(() => {
						calls += 1;
						resolve(value);
					}, 5000)
				);
			});

			const call1 = debouncer.debounce(1111);
			await tick(500);
			expect(calls).toBe(0);

			const call2 = debouncer.debounce(2222);
			await tick(1500);
			expect(calls).toBe(0);

			await tick(5000);
			expect(calls).toBe(1);

			const call3 = debouncer.debounce(3333);
			await tick(6000);
			expect(calls).toBe(2);

			const result = await Promise.all([call1, call2, call3]);
			expect(result).toMatchObject([1111, 1111, 3333]);
		});
	});

	test(`concurrent calls should throw with the error from the first call`, async () => {
		await timers(async ({ tick, flush }) => {
			let calls = 0;

			const debouncer = new Debouncer(async (value) => {
				return new Promise((_, reject) =>
					setTimeout(() => {
						calls += 1;
						reject(new Error('Error ' + value));
					}, 5000)
				);
			});

			let err1 = new Error();
			debouncer.debounce(1111).catch((err) => (err1 = err));
			await tick(500);
			expect(calls).toBe(0);

			let err2 = new Error();
			debouncer.debounce(2222).catch((err) => (err2 = err));
			await tick(1500);
			expect(calls).toBe(0);

			await tick(5000);
			expect(calls).toBe(1);

			await flush();

			let err3 = new Error();
			debouncer.debounce(3333).catch((err) => (err3 = err));
			await tick(6000);

			await flush();

			expect(err1.message).toBe('Error 1111');
			expect(err2.message).toBe('Error 1111');
			expect(err3.message).toBe('Error 3333');
		});
	});
});
