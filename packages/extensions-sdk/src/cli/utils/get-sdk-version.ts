import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
	readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../package.json'), 'utf8')
);

export default function getSdkVersion(): string {
	return pkg.version;
}
