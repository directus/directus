import { afterEach, describe, expect, it, vi } from 'vitest';

const uploadFile = vi.hoisted(() => vi.fn());

vi.mock('@/utils/upload-file', () => ({
	uploadFile,
}));

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

const mockServerInfo = vi.hoisted(() => ({
	uploads: {
		maxParallel: 2,
	},
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({
		info: mockServerInfo,
	}),
}));

vi.mock('./unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import { notify } from '@/utils/notify';
import { uploadFiles } from './upload-files';
import { unexpectedError } from './unexpected-error';

describe('uploadFiles', () => {
	afterEach(() => {
		uploadFile.mockReset();
		vi.mocked(notify).mockReset();
		vi.mocked(unexpectedError).mockReset();
		mockServerInfo.uploads = { maxParallel: 2 };
	});

	it('limits concurrent uploads based on server maxParallel', async () => {
		let inFlight = 0;
		let maxInFlight = 0;
		const resolvers: Array<() => void> = [];

		uploadFile.mockImplementation(() => {
			inFlight += 1;
			maxInFlight = Math.max(maxInFlight, inFlight);

			return new Promise((resolve) => {
				resolvers.push(() => {
					inFlight -= 1;
					resolve({ id: 'test' });
				});
			});
		});

		const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')];

		const uploadPromise = uploadFiles(files);

		await Promise.resolve();
		expect(uploadFile).toHaveBeenCalledTimes(2);

		resolvers[0]!();
		await Promise.resolve();
		expect(uploadFile).toHaveBeenCalledTimes(3);

		resolvers.slice(1).forEach((resolve) => resolve());
		await uploadPromise;

		expect(maxInFlight).toBe(2);
	});

	it('starts all uploads when maxParallel is not set', async () => {
		mockServerInfo.uploads = undefined;
		const startOrder: string[] = [];
		const resolvers: Array<() => void> = [];

		uploadFile.mockImplementation(() => {
			startOrder.push('start');

			return new Promise((resolve) => {
				resolvers.push(() => resolve({ id: 'test' }));
			});
		});

		const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')];

		const uploadPromise = uploadFiles(files);

		await Promise.resolve();
		expect(uploadFile).toHaveBeenCalledTimes(3);

		resolvers.forEach((resolve) => resolve());
		await uploadPromise;

		expect(startOrder).toHaveLength(3);
	});

	it('starts all uploads when maxParallel is 0', async () => {
		mockServerInfo.uploads = { maxParallel: 0 };
		const startOrder: string[] = [];
		const resolvers: Array<() => void> = [];

		uploadFile.mockImplementation(() => {
			startOrder.push('start');

			return new Promise((resolve) => {
				resolvers.push(() => resolve({ id: 'test' }));
			});
		});

		const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')];

		const uploadPromise = uploadFiles(files);

		await Promise.resolve();
		expect(uploadFile).toHaveBeenCalledTimes(3);

		resolvers.forEach((resolve) => resolve());
		await uploadPromise;

		expect(startOrder).toHaveLength(3);
	});

	it('reports progress and chunked upload controllers', async () => {
		const progressUpdates: number[][] = [];
		const chunkedUpdates: Array<Array<unknown | null>> = [];

		uploadFile.mockImplementation(
			(_file, { onProgressChange, onChunkedUpload }) =>
				new Promise((resolve) => {
					onProgressChange?.(10);
					onProgressChange?.(100);
					onChunkedUpload?.({ id: 'controller' });
					resolve({ id: 'uploaded' });
				}),
		);

		const files = [new File(['a'], 'a.txt')];

		const result = await uploadFiles(files, {
			onProgressChange: (percentages) => progressUpdates.push([...percentages]),
			onChunkedUpload: (controllers) => chunkedUpdates.push([...controllers]),
		});

		expect(result).toHaveLength(1);
		expect(progressUpdates).toEqual([[10], [100]]);
		expect(chunkedUpdates).toEqual([[{ id: 'controller' }]]);
	});

	it('notifies on success when notifications are enabled', async () => {
		uploadFile.mockResolvedValue({ id: 'uploaded' });

		const files = [new File(['a'], 'a.txt')];

		await uploadFiles(files, { notifications: true });

		expect(vi.mocked(notify)).toHaveBeenCalledTimes(1);
	});

	it('handles upload errors and returns an empty list', async () => {
		const error = new Error('boom');
		uploadFile.mockRejectedValue(error);

		const result = await uploadFiles([new File(['a'], 'a.txt')]);

		expect(result).toEqual([]);
		expect(vi.mocked(unexpectedError)).toHaveBeenCalledWith(error);
	});
});
