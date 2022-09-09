import { createRequire } from 'module';
import * as path from 'path';

export function resolvePackage(name: string, importPath: string, root?: string): string {
	const require = createRequire(importPath)
	return path.dirname(require.resolve(`${name}/package.json`, root !== undefined ? { paths: [root] } : undefined));
}
