import path from 'path';

export function resolvePackage(name: string, root?: string): string {
	return path.dirname(require.resolve(`${name}/package.json`, root !== undefined ? { paths: [root] } : undefined));
}
