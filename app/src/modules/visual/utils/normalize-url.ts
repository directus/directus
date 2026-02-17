export function normalizeUrl(url: string) {
	try {
		return new URL(url).href.replace(/\/$/, '');
	} catch {
		return '';
	}
}
