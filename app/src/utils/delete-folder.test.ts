import { afterEach, describe, expect, it, vi } from 'vitest';
import { moveAndDelete, moveSingleFolder, recursiveDelete } from './delete-folder';

const apiGet = vi.hoisted(() => vi.fn());
const apiPatch = vi.hoisted(() => vi.fn());
const apiDelete = vi.hoisted(() => vi.fn());

vi.mock('@/api', () => ({
	default: { get: apiGet, patch: apiPatch, delete: apiDelete },
}));

const folder = (id: string, parent: string | null = null) => ({ id, name: id, parent });

afterEach(() => {
	vi.resetAllMocks();
});

describe('moveSingleFolder', () => {
	it('moves child folders and files to parent', async () => {
		apiGet
			.mockResolvedValueOnce({ data: { data: [{ id: 'child-folder' }] } })
			.mockResolvedValueOnce({ data: { data: [{ id: 'child-file' }] } });

		await moveSingleFolder(folder('f1', 'parent-1'));

		expect(apiPatch).toHaveBeenCalledWith('/folders', { keys: ['child-folder'], data: { parent: 'parent-1' } });
		expect(apiPatch).toHaveBeenCalledWith('/files', { keys: ['child-file'], data: { folder: 'parent-1' } });
	});

	it('skips patch when no children', async () => {
		apiGet.mockResolvedValueOnce({ data: { data: [] } }).mockResolvedValueOnce({ data: { data: [] } });

		await moveSingleFolder(folder('f1', null));

		expect(apiPatch).not.toHaveBeenCalled();
	});

	it('uses null parent for root folder', async () => {
		apiGet
			.mockResolvedValueOnce({ data: { data: [{ id: 'child-folder' }] } })
			.mockResolvedValueOnce({ data: { data: [] } });

		await moveSingleFolder(folder('f1', null));

		expect(apiPatch).toHaveBeenCalledWith('/folders', { keys: ['child-folder'], data: { parent: null } });
	});
});

describe('moveAndDelete', () => {
	it('moves contents of all folders then deletes them', async () => {
		apiGet.mockResolvedValue({ data: { data: [] } });

		await moveAndDelete([folder('f1'), folder('f2')]);

		expect(apiDelete).toHaveBeenCalledWith('/folders', { data: ['f1', 'f2'] });
	});
});

describe('recursiveDelete', () => {
	it('deletes folder, its descendants, and all contained files', async () => {
		const all = [folder('root'), folder('child', 'root'), folder('grandchild', 'child')];

		apiGet.mockResolvedValueOnce({ data: { data: [{ id: 'file-1' }, { id: 'file-2' }] } });

		await recursiveDelete([folder('root')], all);

		expect(apiDelete).toHaveBeenCalledWith('/files', { data: ['file-1', 'file-2'] });

		expect(apiDelete).toHaveBeenCalledWith('/folders', {
			data: expect.arrayContaining(['root', 'child', 'grandchild']),
		});
	});

	it('nullifies parents of nested folders before delete to avoid FK issues', async () => {
		const all = [folder('root'), folder('child', 'root')];

		apiGet.mockResolvedValueOnce({ data: { data: [] } });

		await recursiveDelete([folder('root')], all);

		expect(apiPatch).toHaveBeenCalledWith('/folders', { keys: ['child'], data: { parent: null } });
	});

	it('deletes files before folders', async () => {
		const calls: string[] = [];
		apiGet.mockResolvedValueOnce({ data: { data: [{ id: 'f1' }] } });

		apiDelete.mockImplementation((path: string) => {
			calls.push(path);
			return Promise.resolve();
		});

		await recursiveDelete([folder('root')], [folder('root')]);

		expect(calls.indexOf('/files')).toBeLessThan(calls.indexOf('/folders'));
	});

	it('skips file delete when no files', async () => {
		apiGet.mockResolvedValueOnce({ data: { data: [] } });

		await recursiveDelete([folder('root')], [folder('root')]);

		expect(apiDelete).not.toHaveBeenCalledWith('/files', expect.anything());
		expect(apiDelete).toHaveBeenCalledWith('/folders', { data: ['root'] });
	});
});
