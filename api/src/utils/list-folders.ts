import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export default async function listFolders(location: string): Promise<string[]> {
	const fullPath = path.resolve(location);
	const files = await readdir(fullPath);

	const directories: string[] = [];

	for (const file of files) {
		const filePath = path.join(fullPath, file);
		const stats = await stat(filePath);

		if (stats.isDirectory()) {
			directories.push(file);
		}
	}

	return directories;
}
