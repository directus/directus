import { getPackageJson } from '@directus/utils/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { name, version } = await getPackageJson(__dirname);

export { name, version };
