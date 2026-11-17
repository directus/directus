import globToRegExp from 'glob-to-regexp';

export function assertUrlIsInScope(url: string, allowedUrlScopes: string[]): void {
	const urlAllowed = allowedUrlScopes.some((urlScope) => {
		const regex = globToRegExp(urlScope);
		return regex.test(url);
	});

	if (urlAllowed === false) {
		throw new Error(`No permission to request "${url}"`);
	}
}
