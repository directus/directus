export function filterKnownArrayItems(allowed: unknown, known: Set<string>): string[] {
	if (!Array.isArray(allowed)) return [];
	return (allowed as string[]).filter((id) => known.has(id));
}
