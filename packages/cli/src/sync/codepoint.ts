/**
 * Codepoint (UTF-16 code unit) string comparison, never localeCompare/Intl: locale ordering varies by
 * machine, so every deterministic artifact and every sorted line of output depends on this fixed order
 * holding identically across contributors and CI.
 */
export function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
