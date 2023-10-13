import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import { defineLoader } from 'vitepress';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..', '..');

export default defineLoader({
	async load() {
		const { version: fullVersion } = await readPackageJson(join(rootDir, 'directus'));
		const splitVersion = fullVersion.split('.');

		const { packageManager } = await readPackageJson(rootDir);

		return {
			version: {
				full: fullVersion,
				major: splitVersion[0],
				minor: splitVersion.slice(0, 2).join('.'),
			},
			pnpmVersion: packageManager.slice(5),
		};
	},
});

async function readPackageJson(packageDir: string) {
	const packageJsonRaw = await readFile(join(packageDir, 'package.json'), 'utf8');
	return JSON.parse(packageJsonRaw);
}
