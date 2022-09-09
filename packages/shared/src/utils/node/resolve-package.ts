import * as path from 'path';

export function resolvePackage(name: string, ): string {
	return path.dirname(path.resolve(`${name}/package.json`));
}
