import type { FieldKey } from '../types.js';
import type { Query } from '@directus/types';

export function flattenFilter(paths: FieldKey[][], filter: Query['filter']) {
	if (!filter) return;

	const stack: { current: Record<string, unknown> | string; path: string[] }[] = [{ current: filter, path: [] }];

	while (stack.length > 0) {
		const { current, path } = stack.pop()!;

		if (typeof current === 'object' && current !== null) {
			// If the current nested value is an array, we ignore the array order and flatten all
			// nested objects
			const isArray = Array.isArray(current);

			for (const key in current) {
				if (!key.startsWith('_') || key === '_and' || key === '_or' || key === '_some' || key === '_none') {
					// Only deepen the path if the current value can contain more keys
					stack.push({
						current: current[key] as Record<string, unknown> | string,
						path: isArray ? path : [...path, key],
					});
				} else {
					// Ignore all operators and logical grouping in the field paths
					const parts = path.filter((part) => part.startsWith('_') === false);
					if (parts.length > 0) paths.push(parts);
				}
			}
		} else {
			// Ignore all operators and logical grouping in the field paths
			const parts = path.filter((part) => part.startsWith('_') === false);
			if (parts.length > 0) paths.push(parts);
		}
	}
}
