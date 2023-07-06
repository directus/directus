import { stat } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import pMemoize from 'p-memoize';

/**
 * Find the root directory of a package.
 * @param sourcePath Path within the package to start the lookup from
 * @returns The root directory of the package
 */
export async function findPackageRoot(sourcePath: string): Promise<string> {
	let path = sourcePath;
	const { root } = parse(path);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPackageJson = await fileExists(join(path, 'package.json'));

		if (foundPackageJson) {
			return path;
		}

		if (path === root) {
			break;
		}

		path = dirname(path);
	}

	throw new Error(`Couldn't locate package root`);
}

async function fileExists(file: string) {
	try {
		const fileStat = await stat(file);
		return fileStat.isFile();
	} catch {
		return false;
	}
}

/**
 * Memoized version of {@link findPackageRoot}.
 */
export const findPackageRootMem = pMemoize(findPackageRoot);
