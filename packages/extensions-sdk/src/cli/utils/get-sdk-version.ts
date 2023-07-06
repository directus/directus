import { findPackageRoot } from '@directus/utils/node';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function getSdkVersion(): Promise<string> {
	const packageRoot = await findPackageRoot(__dirname);
	const packageJsonPath = join(packageRoot, 'package.json');
	const packageJson = await readFile(packageJsonPath, 'utf8');
	const pkg = JSON.parse(packageJson);
	return pkg.version;
}
