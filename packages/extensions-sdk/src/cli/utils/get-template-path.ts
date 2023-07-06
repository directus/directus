import { findPackageRoot } from '@directus/utils/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function getTemplatePath(): Promise<string> {
	const root = await findPackageRoot(__dirname);
	return path.join(root, 'templates');
}
