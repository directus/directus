import { findPackageRoot } from '@directus/utils/node';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function getTemplatePath(): Promise<string> {
	const root = await findPackageRoot(__dirname);
	return join(root, 'templates');
}
