import { afterEach, describe, expect, it, vi } from 'vitest';

const uploadFile = vi.fn();

vi.mock('@/utils/upload-file', () => ({
	uploadFile,
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

import { uploadFiles } from './upload-files';

describe('uploadFiles', () => {
	afterEach(() => {
		uploadFile.mockReset();
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

		const files = [
			new File(['a'], 'a.txt'),
			new File(['b'], 'b.txt'),
			new File(['c'], 'c.txt'),
		];

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

		const files = [
			new File(['a'], 'a.txt'),
			new File(['b'], 'b.txt'),
			new File(['c'], 'c.txt'),
		];

		const uploadPromise = uploadFiles(files);

		await Promise.resolve();
		expect(uploadFile).toHaveBeenCalledTimes(3);

		resolvers.forEach((resolve) => resolve());
		await uploadPromise;

		expect(startOrder).toHaveLength(3);
	});
});
