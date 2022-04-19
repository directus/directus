/**
 * Get the value of a globally registered CSS variable
 */
export function cssVar(name: string) {
	return getComputedStyle(document.body).getPropertyValue(name).trim();
}
