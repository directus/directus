import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { findRoot } from './find-root.js';

vi.mock('./find-package-root.js', () => {
	return {
		findPackageRoot: vi.fn().mockReturnValue(process.cwd()),
	};
});

describe('findPackageRoot', () => {
	const cwd = join(process.cwd(), 'src', 'test');

	it('finds and returns package root', async () => {
		const root = await findRoot(cwd);

		expect(root).toBe(join(process.cwd(), 'src'));
	});
});
