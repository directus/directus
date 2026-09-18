/**
 * Check whether a path is contained within a directory, to prevent path traversal.
 *
 * Both paths are expected to be normalized upfront (resolved or sanitized) so they can be compared
 * as plain strings. An empty `dirpath` is treated as top level so any path is within.
 *
 * @param filepath Path to check
 * @param dirpath Directory the path should be contained in
 * @param separator Segment separator used by both paths, defaults to the POSIX `/`
 */
export function isWithinPath(filepath: string, dirpath: string, separator = '/'): boolean {
	if (dirpath === '') return true;

	return filepath === dirpath || filepath.startsWith(dirpath + separator);
}
