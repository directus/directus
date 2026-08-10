/**
 * Never localeCompare or Intl: their ordering varies by machine, and every deterministic artifact and
 * sorted line of output depends on this order holding identically across contributors and CI.
 */
export function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
