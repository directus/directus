import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { flushCaches } from '../../../cache.js';
import { useLogger } from '../../../logger/index.js';
import cacheClear from './clear.js';

vi.mock('@directus/env');

vi.mock('../../../cache.js', () => ({
	flushCaches: vi.fn(),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(),
}));

describe('cache clear command', () => {
	let mockLogger: any;

	beforeEach(() => {
		mockLogger = {
			error: vi.fn(),
		};

		vi.mocked(useLogger).mockReturnValue(mockLogger);
		vi.mocked(useEnv).mockReturnValue({ CACHE_STORE: 'redis' } as any);
		vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
		vi.spyOn(process.stdout, 'write').mockImplementation((() => true) as any);
	});

	test('should call flushCaches with forced flag', async () => {
		vi.mocked(flushCaches).mockResolvedValue(undefined);

		await cacheClear();

		expect(flushCaches).toHaveBeenCalledWith(true);
	});

	test('should output success message and exit with 0', async () => {
		vi.mocked(flushCaches).mockResolvedValue(undefined);

		await cacheClear();

		expect(process.stdout.write).toHaveBeenCalledWith('Cache cleared successfully\n');
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('should log error and exit with 1 on failure', async () => {
		const error = new Error('Redis connection failed');
		vi.mocked(flushCaches).mockRejectedValue(error);

		await cacheClear();

		expect(mockLogger.error).toHaveBeenCalledWith(error);
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	test('should warn and exit when CACHE_STORE is not redis', async () => {
		vi.mocked(useEnv).mockReturnValue({ CACHE_STORE: 'memory' } as any);

		await cacheClear();

		expect(flushCaches).not.toHaveBeenCalled();

		expect(process.stdout.write).toHaveBeenCalledWith(
			expect.stringContaining('In-memory caches are local to each running process'),
		);

		expect(process.exit).toHaveBeenCalledWith(0);
	});
});
