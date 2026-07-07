import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// package.json sits one directory above both the built entry (dist/) and this
// source file (src/) — the same relative path resolves in dev and after bundling.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
	version: string;
};

export const version: string = pkg.version;
