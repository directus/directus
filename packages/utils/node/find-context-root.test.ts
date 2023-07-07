import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { findContextRoot } from './find-context-root.js';

vi.mock('./find-package-root.js', () => {
	return {
		findPackageRoot: vi.fn().mockReturnValue(process.cwd()),
	};
});

describe('findContextRoot', () => {
	it('context root same as package root', async () => {
		const sourcePath = process.cwd();
		const contextRoot = await findContextRoot(sourcePath);

		expect(contextRoot).toBe(process.cwd());
	});

	it.each(['src/test', 'src'])(`context root 'src' from '%s'`, async (insideContextPath: string) => {
		const sourcePath = path.join(process.cwd(), ...insideContextPath.split('/'));
		const contextRoot = await findContextRoot(sourcePath);

		expect(contextRoot).toBe(path.join(process.cwd(), 'src'));
	});
});
