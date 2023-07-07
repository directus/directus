import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Find the root directory of a package.
 * @param sourcePath Path within the package to start the lookup from
 * @returns The root directory of the package
 */
export async function findPackageRoot(sourcePath: string): Promise<string> {
	let currentPath = sourcePath;
	const { root } = path.parse(currentPath);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPackageJson = await fileExists(path.join(currentPath, 'package.json'));

		if (foundPackageJson) {
			return currentPath;
		}

		if (currentPath === root) {
			break;
		}

		currentPath = path.dirname(currentPath);
	}

	throw new Error(`Couldn't locate package root`);
}

async function fileExists(file: string) {
	try {
		const fileStat = await fs.stat(file);
		return fileStat.isFile();
	} catch {
		return false;
	}
}
