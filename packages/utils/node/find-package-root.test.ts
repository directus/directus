import fs from 'node:fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { findPackageRoot } from './find-package-root.js';

describe('findPackageRoot', () => {
	const cwd = join(process.cwd(), 'src', 'test');

	// @ts-ignore
	vi.spyOn(fs.promises, 'stat').mockImplementation((path) => {
		if (path === join(process.cwd(), 'package.json')) {
			return { isFile: () => true };
		}

		throw new Error();
	});

	it('finds and returns package root', async () => {
		const packageRoot = await findPackageRoot(cwd);

		expect(packageRoot).toBe(process.cwd());
	});
});
