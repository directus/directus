import { join, relative, sep } from 'node:path';
import pMemoize from 'p-memoize';
import { findPackageRoot } from './find-package-root.js';

/**
 * Find the runtime and source dependent context root directory (usually `src` / `dist`) in a package.
 * @param sourcePath Path within the context of a package to start the lookup from
 * @returns The context root directory
 */
export async function findContextRoot(sourcePath: string): Promise<string> {
	const packageRoot = await findPackageRoot(sourcePath);

	const relativeCwd = relative(packageRoot, sourcePath);
	const sourceDir = relativeCwd.split(sep)[0] || '';

	return join(packageRoot, sourceDir);
}

/**
 * Memoized version of {@link findContextRoot}.
 */
export const findRootMem = pMemoize(findContextRoot);
