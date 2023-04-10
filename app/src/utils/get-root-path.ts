/**
 * Get the API root location from the current window path
 */
export function getRootPath(): string {
	return extract(window.location.pathname);
}

/**
 * Get the full API root URL from the current page href
 */
export function getPublicURL(): string {
	return extract(window.location.href);
}

/**
 * Extract the root path of the admin app from a given input path/url
 *
 * @param path - Path or URL string of the current page
 * @returns - Root URL of the Directus instance
 */
export function extract(path: string) {
	const parts = path.split('/');
	const adminIndex = parts.indexOf('admin');
	const rootPath = parts.slice(0, adminIndex).join('/') + '/';
	return rootPath;
}
