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

	// `removeLeading` strips the leading separator of the normalized result. The
	// original check tested the raw input for a forward slash only, so a Windows-style
	// leading backslash (e.g. `\a\b\c`, which normalizes to `/a/b/c`) kept its leading
	// slash. Exclude the UNC prefix (`//?/…`, `//./…`), whose leading slashes are intentional.
	if (removeLeading && !prefix && (path.startsWith('/') || path.startsWith('\\'))) {
		return normalizedPath.substring(1);
	}

	return normalizedPath;
};
