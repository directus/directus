import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const pkg = JSON.parse(await readFile(join(import.meta.dirname, 'package.json'), 'utf8'));

export const version = pkg.version;
