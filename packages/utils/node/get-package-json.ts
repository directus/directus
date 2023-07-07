import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { findPackageRoot } from './find-package-root.js';

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

interface PackageJson extends Record<string, JSONValue> {
	name: string;
	version: string;
}

export async function getPackageJson(sourcePath: string): Promise<PackageJson> {
	const packageRoot = await findPackageRoot(sourcePath);
	const packageJsonPath = join(packageRoot, 'package.json');
	const packageJsonRaw = await readFile(packageJsonPath, 'utf8');
	const packageJson = JSON.parse(packageJsonRaw) as PackageJson;
	return packageJson;
}
