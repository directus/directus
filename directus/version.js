import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));

export const version = pkg.version;
