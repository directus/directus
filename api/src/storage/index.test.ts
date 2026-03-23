import { StorageManager } from '@directus/storage';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { validateEnv } from '../utils/validate-env.js';
import { registerDrivers } from './register-drivers.js';
import { registerLocations } from './register-locations.js';
import { _cache, getStorage } from './index.js';

vi.mock('@directus/storage');
vi.mock('./register-drivers.js');
vi.mock('./register-locations.js');
vi.mock('../utils/validate-env.js');

let mockStorage: StorageManager;

beforeEach(() => {
	mockStorage = {} as StorageManager;
	_cache.storage = null;
	vi.mocked(StorageManager).mockReturnValue(mockStorage);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Returns storage from cache immediately if cache has been filled', async () => {
	_cache.storage = mockStorage;
	expect(await getStorage());
});

test('Validates STORAGE_LOCATIONS to exist in env', async () => {
	await getStorage();
	expect(validateEnv).toHaveBeenCalledWith(['STORAGE_LOCATIONS']);
});

test('Creates new StorageManager instance in cache', async () => {
	await getStorage();
	expect(StorageManager).toHaveBeenCalledOnce();
	expect(StorageManager).toHaveBeenCalledWith();
	expect(_cache.storage).toBe(mockStorage);
});

test('Registers drivers against cached storage manager', async () => {
	await getStorage();
	expect(registerDrivers).toHaveBeenCalledWith(_cache.storage);
});

test('Registers locations against cached storage manager', async () => {
	await getStorage();
	expect(registerLocations).toHaveBeenCalledWith(_cache.storage);
});

test('Returns cached storage manager', async () => {
	const storage = await getStorage();
	expect(storage).toBe(_cache.storage);
	expect(storage).toBe(mockStorage);
});
