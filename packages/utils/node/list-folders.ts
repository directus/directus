import path from 'path';
import fse from 'fs-extra';

interface ListFoldersOptions {
	/**
	 * Ignore folders starting with a period `.`
	 */
	ignoreHidden?: boolean;
}

export async function listFolders(location: string, options?: ListFoldersOptions): Promise<string[]> {
	const fullPath = path.resolve(location);
	const files = await fse.readdir(fullPath);

	const directories: string[] = [];

	for (const file of files) {
		if (options?.ignoreHidden && file.startsWith('.')) {
			continue;
		}

		const filePath = path.join(fullPath, file);

		const stats = await fse.stat(filePath);

		if (stats.isDirectory()) {
			directories.push(file);
		}
	}

	return directories;
}
