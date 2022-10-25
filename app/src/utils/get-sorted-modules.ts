/**
 * Sorts the resolved modules from Vite's import.meta.glob
 *
 * @param items - resolved modules
 * @param path - glob pattern
 * @returns Sorted modules
 */
export function getSortedModules<T>(items: Record<string, { default: T }>, path: string): T[] {
	const wildcardIndex = path.split('/').indexOf('*');
	return Object.entries(items)
		.sort(([keyA, _moduleA], [keyB, _moduleB]) =>
			keyA.split('/')[wildcardIndex].localeCompare(keyB.split('/')[wildcardIndex])
		)
		.map(([_key, module]) => module.default);
}
