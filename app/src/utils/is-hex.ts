/**
 * Returns whether or not a given string is a valid hex color
 */
export function isHex(hex: string): boolean {
	return /^#(([a-f\d]{3,4}))$/i.test(hex) || /^#(([a-f\d]{2}){3,4})$/i.test(hex);
}
