import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function resolvePackage(name: string, root?: string): string {
	return path.dirname(require.resolve(`${name}/package.json`, root !== undefined ? { paths: [root] } : undefined));
}
