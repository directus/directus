import path from 'path';
import fse from 'fs-extra';

export async function listFolders(location: string): Promise<string[]> {
	const fullPath = path.resolve(location);
	const files = await fse.readdir(fullPath);

	const directories: string[] = [];

	for (const file of files) {
		const filePath = path.join(fullPath, file);
		const stats = await fse.stat(filePath);

		if (stats.isDirectory()) {
			directories.push(file);
		}
	}

	return directories;
}
