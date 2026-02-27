/**
 * Count models in the allowed list that are NOT in the known defaults (i.e. custom entries).
 */
export function countCustomModels(allowed: unknown, known: Set<string>): number {
	if (!Array.isArray(allowed)) return 0;
	return (allowed as string[]).filter((id) => !known.has(id)).length;
}
