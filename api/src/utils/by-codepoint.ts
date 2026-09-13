/** Comparator for a locale-independent sort, so ordering is reproducible across machines. */
export function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
