/**
 * Normalizes a URL string by resolving it against the current window location.
 * Returns null if the URL is invalid or empty.
 */
export function normalizeUrl(url: string | null): string | null {
	if (!url) return null;

	try {
		return new URL(url, window.location.href).href;
	} catch {
		return null;
	}
}
