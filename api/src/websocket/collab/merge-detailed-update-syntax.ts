import { isDetailedUpdateSyntax } from '@directus/utils';
import { useLogger } from '../../logger/index.js';

/**
 * Merge detailed update syntax from two concurrent updates
 */
export function mergeDetailedUpdateSyntax(existing: any, incoming: any): any {
	return {
		// Last Write Wins to support additions and removals of items
		create: incoming.create,
		update: mergeUpdateArrays(existing.update, incoming.update),
		delete: incoming.delete,
	};
}

/**
 * Merge update arrays by ID
 */
function mergeUpdateArrays(existing: any[], incoming: any[]): any[] {
	const merged = [...existing];

	for (const incomingItem of incoming) {
		const existingIndex = merged.findIndex((item) => item.id === incomingItem.id);

		if (existingIndex >= 0) {
			const existingItem = merged[existingIndex];
			const mergedItem = { ...existingItem };

			for (const [key, value] of Object.entries(incomingItem)) {
				if (isDetailedUpdateSyntax(value) && isDetailedUpdateSyntax(existingItem[key])) {
					mergedItem[key] = mergeDetailedUpdateSyntax(existingItem[key], value);
				} else {
					mergedItem[key] = value;
				}
			}

			merged[existingIndex] = mergedItem;

			useLogger().debug(
				`[Collab] Merged update for item ${incomingItem.id} - fields: ${Object.keys(incomingItem).join(', ')}`,
			);
		} else {
			merged.push(incomingItem);
		}
	}

	return merged;
}
