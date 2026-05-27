/**
 * Generate a simple short hash for a given string
 * This is not cryptographically secure in any way, and has a high chance of collision
 */
export function getSimpleHash(str: string): string {
	let hash = 0;

	for (let i = 0; i < str.length; hash &= hash) {
		hash = 31 * hash + str.charCodeAt(i++);
	}

	return Math.abs(hash).toString(16);
}
