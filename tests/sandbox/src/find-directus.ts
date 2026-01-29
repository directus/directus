import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export const directusFolder = findDirectus();

export function findDirectus() {
	let currentDir = process.cwd();

	while (true) {
		const packagePath = join(currentDir, 'package.json');

		if (existsSync(packagePath)) {
			const file = readFileSync(packagePath, 'utf-8');
			const json = JSON.parse(file);

			if (json['name'] === 'directus-monorepo') {
				return currentDir;
			}
		}

		const parentDir = dirname(currentDir);

		if (parentDir === currentDir) {
			break;
		}

		currentDir = parentDir;
	}

	throw new Error('Sandbox is not executed in the directus monorepo');
}
