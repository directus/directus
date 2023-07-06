import { findPackageRoot } from '@directus/utils/node';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function getSdkVersion(): Promise<string> {
	const packageRoot = await findPackageRoot(__dirname);
	const packageJsonPath = path.join(packageRoot, 'package.json');
	const packageJson = await fs.promises.readFile(packageJsonPath, 'utf8');
	const pkg = JSON.parse(packageJson);
	return pkg.version;
}
