/**
 * Check if a hostname matches any of the provided domain patterns.
 * Supports exact match and `*.example.com` wildcard prefix (matches subdomains, not base).
 * Case-insensitive. Whitespace in patterns is trimmed.
 */
export function isDomainAllowed(hostname: string, patterns: string[]): boolean {
	const lower = hostname.toLowerCase();

	for (const pattern of patterns) {
		const p = pattern.toLowerCase().trim();
		if (!p) continue;

		if (p.startsWith('*.')) {
			const suffix = p.slice(1); // ".example.com"
			if (lower.endsWith(suffix) && lower.length > suffix.length) return true;
		} else if (lower === p) {
			return true;
		}
	}

	return false;
}
