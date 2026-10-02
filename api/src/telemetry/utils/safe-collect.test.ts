import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { MAX_CONCURRENT_COLLECTORS, safeCollect } from './safe-collect.js';

vi.mock('../../logger/index.js');

let mockLogger: { warn: ReturnType<typeof vi.fn> };

describe('safeCollect', () => {
	beforeEach(() => {
		mockLogger = { warn: vi.fn() };
		vi.mocked(useLogger).mockReturnValue(mockLogger as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('resolves with the collector result', async () => {
		await expect(safeCollect('example', async () => ({ count: 1 }))).resolves.toStrictEqual({ count: 1 });
	});

	test('resolves with null when the collector rejects', async () => {
		await expect(
			safeCollect('example', async () => {
				throw new Error('no connection');
			}),
		).resolves.toBeNull();
	});

	test('logs the failure with the collector name', async () => {
		const error = new Error('no connection');

		await safeCollect('metrics.files', async () => {
			throw error;
		});

		expect(mockLogger.warn).toHaveBeenCalledWith(error, expect.stringContaining('metrics.files'));
	});

	test('resolves with null when the collector throws synchronously', async () => {
		await expect(
			safeCollect('example', () => {
				throw new Error('no connection');
			}),
		).resolves.toBeNull();
	});

	test('runs no more than MAX_CONCURRENT_COLLECTORS collectors at a time', async () => {
		let running = 0;
		let peak = 0;

		const collect = async () => {
			running++;
			peak = Math.max(peak, running);
			await new Promise((resolve) => setImmediate(resolve));
			running--;
			return true;
		};

		await Promise.all(Array.from({ length: MAX_CONCURRENT_COLLECTORS * 3 }, () => safeCollect('example', collect)));

		expect(peak).toBe(MAX_CONCURRENT_COLLECTORS);
	});
});
