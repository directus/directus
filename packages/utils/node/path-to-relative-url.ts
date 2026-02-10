import path from 'path';

export function pathToRelativeUrl(filePath: string, root = '.'): string {
	return path.relative(root, filePath).split(path.sep).join(path.posix.sep);
}
