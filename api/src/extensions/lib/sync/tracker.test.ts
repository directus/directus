import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readdir, rm } from 'node:fs/promises';
import { sep } from 'node:path';
import { SyncFileTracker } from './tracker.js';

vi.mock('node:fs/promises');

describe('SyncFileTracker', () => {
	let tracker: SyncFileTracker;

	beforeEach(() => {
		tracker = new SyncFileTracker();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('readLocalFiles', () => {
		test('should return 0 when directory does not exist', async () => {
			vi.mocked(readdir).mockRejectedValue(new Error('Directory not found'));

			const result = await tracker.readLocalFiles('/non-existent/path');
			expect(result).toBe(0);
		});

		test('should count only files and ignore directories', async () => {
			vi.mocked(readdir).mockResolvedValue([
				{ isFile: () => true, name: 'file1.js', parentPath: '/test/path' },
				{ isFile: () => false, name: 'folder', parentPath: '/test/path' },
				{ isFile: () => true, name: 'file2.js', parentPath: '/test/path/folder' },
			] as any);

			const result = await tracker.readLocalFiles('/test/path');
			expect(result).toBe(2);
		});
	});

	describe('cleanup', () => {
		test('should not remove anything when all files are tracked', async () => {
			vi.mocked(readdir).mockResolvedValue([
				{ isFile: () => true, name: 'file1.js', parentPath: '/base/path' },
				{ isFile: () => true, name: 'file2.js', parentPath: '/base/path/sub' },
			] as any);

			await tracker.readLocalFiles('/base/path');
			await tracker.passedFile('file1.js');
			await tracker.passedFile(`sub${sep}file2.js`);
			await tracker.cleanup('/base/path');

			expect(vi.mocked(rm)).not.toHaveBeenCalled();
		});

		test('should remove directories with untracked files', async () => {
			vi.mocked(readdir).mockResolvedValue([
				{ isFile: () => true, name: 'file1.js', parentPath: '/base/path/hooks' },
				{ isFile: () => true, name: 'file2.js', parentPath: '/base/path/endpoints' },
			] as any);

			await tracker.readLocalFiles('/base/path');
			await tracker.passedFile(`hooks${sep}file1.js`);
			await tracker.cleanup('/base/path');

			expect(vi.mocked(rm)).toHaveBeenCalledWith(`${sep}base${sep}path${sep}endpoints`, {
				recursive: true,
				force: true,
			});
		});

		test('should remove highest level directories recursively', async () => {
			vi.mocked(readdir).mockResolvedValue([
				{ isFile: () => true, name: 'file1.js', parentPath: '/base/path/hooks' },
				{ isFile: () => true, name: 'file2.js', parentPath: '/base/path/hooks/sub' },
				{ isFile: () => true, name: 'file3.js', parentPath: '/base/path/hooks/sub/deep' },
			] as any);

			await tracker.readLocalFiles('/base/path');
			await tracker.cleanup('/base/path');

			const rmMock = vi.mocked(rm);
			// Should only call rm once for the top-level directory 'hooks'
			expect(rmMock).toHaveBeenCalledTimes(1);
			expect(rmMock).toHaveBeenCalledWith(`${sep}base${sep}path${sep}hooks`, { recursive: true, force: true });
		});

		test('should handle mixed tracked and untracked directory hierarchies', async () => {
			vi.mocked(readdir).mockResolvedValue([
				{ isFile: () => true, name: 'file1.js', parentPath: '/base/path/hooks/sub' },
				{ isFile: () => true, name: 'file2.js', parentPath: '/base/path/endpoints' },
				{ isFile: () => true, name: 'file3.js', parentPath: '/base/path/operations' },
			] as any);

			await tracker.readLocalFiles('/base/path');
			await tracker.passedFile(`hooks${sep}sub${sep}file1.js`);
			await tracker.cleanup('/base/path');

			const rmMock = vi.mocked(rm);
			expect(rmMock).toHaveBeenCalledTimes(2);
			expect(rmMock).toHaveBeenCalledWith(`${sep}base${sep}path${sep}endpoints`, { recursive: true, force: true });
			expect(rmMock).toHaveBeenCalledWith(`${sep}base${sep}path${sep}operations`, { recursive: true, force: true });
		});
	});
});
