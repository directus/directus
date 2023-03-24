import { readFileSync } from 'node:fs';
export const spec = JSON.stringify(readFileSync('./dist/openapi.json'));
