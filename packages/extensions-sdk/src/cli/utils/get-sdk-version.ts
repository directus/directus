import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../package.json'), 'utf8'));

export default function getSdkVersion(): string {
	return pkg.version;
}
