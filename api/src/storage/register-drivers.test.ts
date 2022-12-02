// @ts-expect-error https://github.com/microsoft/TypeScript/issues/49721
import type { Driver, StorageManager } from '@directus/storage';

import { afterEach, expect, test, vi } from 'vitest';
import { getEnv } from '../env';
import { getStorageDriver } from './get-storage-driver';
import { registerDrivers } from './register-drivers';

vi.mock('./get-storage-driver');
vi.mock('../env');

afterEach(() => {
	vi.clearAllMocks();
});

test('Ignores STORAGE variables that are not driver', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		STORAGE_SOMETHING: 'x',
	});

	const mockStorageManager = {
		registerDriver: vi.fn(),
	} as unknown as StorageManager;

	registerDrivers(mockStorageManager);

	expect(mockStorageManager.registerDriver).toHaveBeenCalledTimes(0);
});

test('Ignores DRIVER variables that do not have the STORAGE prefix', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		SOMETHING_DRIVER: 'x',
	});

	const mockStorageManager = {
		registerDriver: vi.fn(),
	} as unknown as StorageManager;

	registerDrivers(mockStorageManager);

	expect(mockStorageManager.registerDriver).toHaveBeenCalledTimes(0);
});

test('Registers all drivers on the passed manager', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		STORAGE_A_DRIVER: 'x',
		STORAGE_Y_DRIVER: 'y',
	});

	const mockStorageManager = {
		registerDriver: vi.fn(),
	} as unknown as StorageManager;

	const mockDriverX = {} as typeof Driver;
	const mockDriverY = {} as typeof Driver;

	vi.mocked(getStorageDriver).mockImplementation((driver) => {
		if (driver === 'x') return Promise.resolve(mockDriverX);
		return Promise.resolve(mockDriverY);
	});

	registerDrivers(mockStorageManager);

	expect(mockStorageManager.registerDriver).toHaveBeenCalledWith('x', mockDriverX);
	expect(mockStorageManager.registerDriver).toHaveBeenCalledWith('y', mockDriverY);
});
