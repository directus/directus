export function sameOrigin(url1: string, url2: string): boolean {
	try {
		return new URL(url1).origin === new URL(url2).origin;
	} catch {
		return false;
	}
}
