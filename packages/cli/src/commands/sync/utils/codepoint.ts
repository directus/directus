/** Never localeCompare or Intl: their ordering varies by machine, and artifacts must be reproducible. */
export function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
