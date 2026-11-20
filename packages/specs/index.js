import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const spec = JSON.parse(readFileSync(resolve(import.meta.dirname, './dist/openapi.json'), 'utf8'));
