import path from 'node:path';
import pMemoize from 'p-memoize';
import { findPackageRoot } from './find-package-root.js';

/**
 * Find the runtime dependent root directory (usually `src` / `dist`) in a package.
 * @param cwd Path within the package used for the lookup
 * @returns The root directory
 */
export async function findRoot(cwd: string): Promise<string> {
	const packageRoot = await findPackageRoot(cwd);

	const relativeCwd = path.relative(packageRoot, cwd);
	const sourceDir = relativeCwd.split(path.sep)[0] || '';

	return path.join(packageRoot, sourceDir);
}

/**
 * Memoized version of {@link findRoot}.
 */
export const findRootMem = pMemoize(findRoot);
