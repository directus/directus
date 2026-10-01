import path from 'node:path';

/**
 * Check whether a path is a directory or contained within it, to prevent path traversal.
 *
 * Relative paths are resolved against the cwd, so an empty `dirpath` contains every relative path.
 *
 * @param filepath Path to check
 * @param dirpath Directory the path should be contained in
 */
export function isWithinPath(filepath: string, dirpath: string): boolean {
	const relative = path.relative(dirpath, filepath);

	return relative !== '..' && relative.startsWith('..' + path.sep) === false && path.isAbsolute(relative) === false;
}
