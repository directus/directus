export function isInScope(item: { collection: string }, scope: Set<string> | null) {
	if (scope === null) return true;
	return scope.has(item.collection);
}
