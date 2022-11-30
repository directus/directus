import { StorageManager } from '@directus/drive';
import { test, expect, vi, afterEach } from 'vitest';
import { getStorage, _cache } from './index';
import { validateEnv } from '../utils/validate-env';
import { getStorageConfig } from './get-storage-config';
import { registerDrivers } from './register-drivers';

vi.mock('@directus/drive');
vi.mock('../utils/validate-env');
vi.mock('./get-storage-config');
vi.mock('./register-drivers');

afterEach(() => {
	vi.clearAllMocks();
	_cache._storage = null;
});

test('Returns cached storage manager if exists', async () => {
	const mockStorageManager = {} as unknown as StorageManager;
	_cache._storage = mockStorageManager;

	const result = await getStorage();

	expect(result).toBe(mockStorageManager);
});

test('Validates environment for storage locations', async () => {
	await getStorage();

	expect(validateEnv).toHaveBeenCalledWith(['STORAGE_LOCATIONS']);
});

test('Creates StorageManager instance with generated options', async () => {
	const mockConfig = {};
	vi.mocked(getStorageConfig).mockReturnValueOnce(mockConfig);

	await getStorage();

	expect(StorageManager).toHaveBeenCalledWith(mockConfig);
});

test('Registers drivers on the cached storage manager', async () => {
	const mockConfig = {};
	vi.mocked(getStorageConfig).mockReturnValueOnce(mockConfig);
	const mockStorageManager = {} as unknown as StorageManager;
	vi.mocked(StorageManager).mockReturnValueOnce(mockStorageManager);

	await getStorage();

	expect(registerDrivers).toHaveBeenCalledWith(mockStorageManager);
});
