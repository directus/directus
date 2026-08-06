/**
 * Replace windows style backslashes with unix forwards slashes
 */
export const normalizePath = (
	path: string,
	{
		removeLeading,
	}: {
		removeLeading: boolean;
	} = { removeLeading: false },
): string => {
	if (path === '\\' || path === '/') return '/';

	if (path.length <= 1) {
		return path;
	}

	let prefix = '';

	if (path.length > 4 && path[3] === '\\') {
		if (['?', '.'].includes(path[2]!) && path.slice(0, 2) === '\\\\') {
			path = path.slice(2);
			prefix = '//';
		}
	}

	const segments = path.split(/[/\\]+/);

	if (segments.at(-1) === '') {
		segments.pop();
	}

	const normalizedPath = prefix + segments.join('/');

	// Check the normalized path, not the raw input: a backslash-rooted path such
	// as `\a\b\c` becomes `/a/b/c` after normalization, and its leading slash
	// should be removed too. The UNC prefix (`prefix`) is left untouched.
	if (removeLeading && !prefix && normalizedPath.startsWith('/')) {
		return normalizedPath.substring(1);
	}

	return normalizedPath;
};
