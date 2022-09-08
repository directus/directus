import * as path from 'path';

export function resolvePackage(require: any, name: string, root?: string): string {
	return path.dirname(require.resolve(`${name}/package.json`, root !== undefined ? { paths: [root] } : undefined));
}
