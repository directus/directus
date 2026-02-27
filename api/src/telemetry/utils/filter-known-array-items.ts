/**
 * Return an array of items from the input array that appear in the known set.
 * Unknown / custom items are excluded — they are counted separately.
 */
export function filterKnownArrayItems(allowed: unknown, known: Set<string>): string[] {
	if (!Array.isArray(allowed)) return [];
	return (allowed as string[]).filter((id) => known.has(id));
}
