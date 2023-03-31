import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const spec = JSON.parse(
	readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './dist/openapi.json'), 'utf8')
);
