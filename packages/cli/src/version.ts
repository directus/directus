import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// package.json sits one directory above both src/ and the built dist/, so this one relative path
// resolves in dev and after bundling alike.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
	version: string;
};

export const version: string = pkg.version;
