import { REDACTED_TEXT } from '@directus/utils';

export function redactQuery(originalPath: string) {
	try {
		const url = new URL(originalPath, 'http://example.com/');

		if (url.searchParams.has('access_token')) {
			url.searchParams.set('access_token', REDACTED_TEXT);
		}

		return url.pathname + url.search;
	} catch {
		return originalPath;
	}
}
