import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { name, version } = readPackageFile('api/package.json') as {
	name: string;
	version: string;
};

const { version: releaseVersion } = readPackageFile('directus/package.json');

export { name, version, releaseVersion };

function readPackageFile(path: string) {
	return JSON.parse(readFileSync(resolve(__dirname, '../../../', path), 'utf8'));
}
