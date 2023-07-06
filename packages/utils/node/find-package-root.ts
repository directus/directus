import fs from 'node:fs';
import path from 'node:path';
import pMemoize from 'p-memoize';

/**
 * Find the root directory of a package.
 * @param cwd Path within the package used for the lookup
 * @returns The root directory of the package
 */
export async function findPackageRoot(cwd: string): Promise<string> {
	let directory = cwd;
	const { root } = path.parse(directory);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPackageJson = await fileExists(path.join(directory, 'package.json'));

		if (foundPackageJson) {
			return directory;
		}

		if (directory === root) {
			break;
		}

		directory = path.dirname(directory);
	}

	throw new Error(`Couldn't locate package root`);
}

async function fileExists(file: string) {
	try {
		const stat = await fs.promises.stat(file);
		return stat.isFile();
	} catch {
		return false;
	}
}

/**
 * Memoized version of {@link findPackageRoot}.
 */
export const findPackageRootMem = pMemoize(findPackageRoot);
