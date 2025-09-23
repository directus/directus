import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const curDirectory = dirname(fileURLToPath(import.meta.url));

const staticSpec = JSON.parse(readFileSync(resolve(curDirectory, './static.json'), 'utf8'));
const dynamicSpec = JSON.parse(readFileSync(resolve(curDirectory, './dynamic.json'), 'utf8'));

export { dynamicSpec, staticSpec as spec, staticSpec };

