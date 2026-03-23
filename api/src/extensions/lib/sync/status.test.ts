import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exists } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getExtensionsPath } from '../get-extensions-path.js';
import { getSyncStatus, isSynchronizing, setSyncStatus, SyncStatus } from './status.js';

vi.mock('fs-extra');
vi.mock('node:fs/promises');
vi.mock('../get-extensions-path.js');

describe('extensions sync status', () => {
	const mockExtensionsPath = '/mock/extensions/path';
	const statusFilePath = join(mockExtensionsPath, '.status');

	beforeEach(() => {
		vi.mocked(getExtensionsPath).mockReturnValue(mockExtensionsPath);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getSyncStatus', () => {
		test('should return SYNCING when status file exists', async () => {
			// @ts-ignore
			vi.mocked(exists).mockResolvedValue(true);

			const status = await getSyncStatus();
			expect(status).toBe(SyncStatus.SYNCING);
		});

		test('should return IDLE when status file does not exist', async () => {
			// @ts-ignore
			vi.mocked(exists).mockResolvedValue(false);

			const status = await getSyncStatus();
			expect(status).toBe(SyncStatus.IDLE);
		});
	});

	describe('setSyncStatus', () => {
		test('should create status file when setting status to SYNCING', async () => {
			await setSyncStatus(SyncStatus.SYNCING);

			expect(writeFile).toHaveBeenCalledWith(statusFilePath, '');
			expect(rm).not.toHaveBeenCalled();
		});

		test('should remove status file when setting status to IDLE', async () => {
			await setSyncStatus(SyncStatus.IDLE);

			expect(rm).toHaveBeenCalledWith(statusFilePath);
			expect(writeFile).not.toHaveBeenCalled();
		});
	});

	describe('isSynchronizing', () => {
		test('should return true when status file exists', async () => {
			// @ts-ignore
			vi.mocked(exists).mockResolvedValue(true);

			const result = await isSynchronizing();
			expect(result).toBe(true);
		});

		test('should return false when status file does not exist', async () => {
			// @ts-ignore
			vi.mocked(exists).mockResolvedValue(false);

			const result = await isSynchronizing();
			expect(result).toBe(false);
		});
	});
});
