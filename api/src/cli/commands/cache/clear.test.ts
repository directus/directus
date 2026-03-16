import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearSystemCache, getCache } from '../../../cache.js';
import { useLogger } from '../../../logger/index.js';
import cacheClear from './clear.js';

vi.mock('@directus/env');

vi.mock('../../../cache.js', () => ({
	clearSystemCache: vi.fn(),
	getCache: vi.fn().mockReturnValue({ cache: { clear: vi.fn() } }),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(),
}));

describe('cache clear command', () => {
	let mockLogger: any;
	let mockCacheClear: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = {
			error: vi.fn(),
		};

		mockCacheClear = vi.fn();
		vi.mocked(useLogger).mockReturnValue(mockLogger);
		vi.mocked(useEnv).mockReturnValue({ CACHE_STORE: 'redis' } as any);
		vi.mocked(getCache).mockReturnValue({ cache: { clear: mockCacheClear } } as any);
		vi.mocked(clearSystemCache).mockResolvedValue(undefined);
		vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
		vi.spyOn(process.stdout, 'write').mockImplementation((() => true) as any);
	});

	test('should clear all caches by default', async () => {
		await cacheClear({});

		expect(clearSystemCache).toHaveBeenCalledWith({ forced: true });
		expect(mockCacheClear).toHaveBeenCalled();
		expect(process.stdout.write).toHaveBeenCalledWith('Cleared all caches successfully\n');
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('should clear only system cache with --system flag', async () => {
		await cacheClear({ system: true });

		expect(clearSystemCache).toHaveBeenCalledWith({ forced: true });
		expect(mockCacheClear).not.toHaveBeenCalled();
		expect(process.stdout.write).toHaveBeenCalledWith('Cleared system cache successfully\n');
	});

	test('should clear only data cache with --data flag', async () => {
		await cacheClear({ data: true });

		expect(clearSystemCache).not.toHaveBeenCalled();
		expect(mockCacheClear).toHaveBeenCalled();
		expect(process.stdout.write).toHaveBeenCalledWith('Cleared data cache successfully\n');
	});

	test('should clear both when --system and --data are passed', async () => {
		await cacheClear({ system: true, data: true });

		expect(clearSystemCache).toHaveBeenCalledWith({ forced: true });
		expect(mockCacheClear).toHaveBeenCalled();
	});

	test('should log error and exit with 1 on failure', async () => {
		const error = new Error('Redis connection failed');
		vi.mocked(clearSystemCache).mockRejectedValue(error);

		await cacheClear({});

		expect(mockLogger.error).toHaveBeenCalledWith(error);
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	test('should warn and exit when CACHE_STORE is not redis', async () => {
		vi.mocked(useEnv).mockReturnValue({ CACHE_STORE: 'memory' } as any);

		await cacheClear({});

		expect(clearSystemCache).not.toHaveBeenCalled();
		expect(mockCacheClear).not.toHaveBeenCalled();

		expect(process.stdout.write).toHaveBeenCalledWith(
			expect.stringContaining('In-memory caches are local to each running process'),
		);

		expect(process.exit).toHaveBeenCalledWith(0);
	});
});
