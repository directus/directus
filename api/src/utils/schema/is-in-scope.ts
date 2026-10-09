/** Keep entities within the requested collection scope. A `null` scope matches everything. */
export function isInScope(item: { collection: string }, scope: Set<string> | null) {
	if (scope === null) return true;
	return scope.has(item.collection);
}
