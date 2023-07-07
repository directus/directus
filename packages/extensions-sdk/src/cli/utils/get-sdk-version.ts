import { getPackageJson } from '@directus/utils/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function getSdkVersion(): Promise<string> {
	const { version } = await getPackageJson(__dirname);

	return version;
}
