import path from 'node:path';
import { findPackageRoot } from './find-package-root.js';

/**
 * Find the runtime and source dependent context root directory (usually `src` / `dist`) in a package.
 * @param sourcePath Path within the context of a package to start the lookup from
 * @returns The context root directory
 */
export async function findContextRoot(sourcePath: string): Promise<string> {
	const packageRoot = await findPackageRoot(sourcePath);

	const relativeCwd = path.relative(packageRoot, sourcePath);
	const sourceDir = relativeCwd.split(path.sep)[0] || '';

	return path.join(packageRoot, sourceDir);
}
