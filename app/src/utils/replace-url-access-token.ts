export function replaceUrlAccessToken(url: string, token: string | null): string {
	const parsedUrl = new URL(url);
	const params = new URLSearchParams(parsedUrl.search);

	if (!token) {
		params.delete('access_token');
	} else {
		params.set('access_token', token);
	}

	return Array.from(params).length > 0
		? `${parsedUrl.origin}${parsedUrl.pathname}?${params.toString()}`
		: `${parsedUrl.origin}${parsedUrl.pathname}`;
}
