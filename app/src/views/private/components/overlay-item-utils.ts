function isPlainRecord(value: unknown): value is Record<string, any> {
	if (typeof value !== 'object' || value === null) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/**
 * Merge a freshly fetched junction/main record into `currentInitialValues` without
 * clobbering a related object already loaded by `fetchRelatedItem()` for `junctionField`.
 */
export function mergeFetchedItemInitialValues(
	currentInitialValues: Record<string, any> | null,
	fetchedItem: Record<string, any>,
	junctionField: string | null | undefined,
): Record<string, any> {
	if (!junctionField || !currentInitialValues) return fetchedItem;

	const existingRelated = currentInitialValues[junctionField];
	if (!isPlainRecord(existingRelated)) return fetchedItem;

	const incomingRelated = fetchedItem[junctionField];
	if (isPlainRecord(incomingRelated)) return fetchedItem;

	return {
		...fetchedItem,
		[junctionField]: existingRelated,
	};
}

/**
 * Check whether staged edits already carry a payload for `junctionField`
 * (for example, a related item edited or created inside a parent content version).
 */
export function hasStagedJunctionValues(
	edits: Record<string, any> | null | undefined,
	junctionField: string | null | undefined,
): boolean {
	if (!edits || !junctionField) return false;
	const staged = edits[junctionField];
	return isPlainRecord(staged) && Object.keys(staged).length > 0;
}
