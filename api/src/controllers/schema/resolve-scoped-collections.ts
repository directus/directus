import { InvalidPayloadError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';

/**
 * Resolves a collection scope into a list of collections a partial snapshot should contain. Names not present in the
 * schema are ignored.
 *
 * @param schema - Overview of the current schema, used to validate names and to build the exclude complement.
 * @param scope - The requested scope; `includeCollections` and `excludeCollections` are mutually exclusive.
 * @param scope.includeCollections - Restrict the snapshot to exactly these collections.
 * @param scope.excludeCollections - Include every collection except these.
 * @returns The collections to snapshot, or `null` for a full snapshot
 * @throws {InvalidPayloadError} If both `includeCollections` and `excludeCollections` are provided.
 */
export function resolveScopedCollections(
	schema: SchemaOverview,
	scope: {
		includeCollections?: string[] | undefined;
		excludeCollections?: string[] | undefined;
	},
): string[] | null {
	const { includeCollections, excludeCollections } = scope;

	if (includeCollections && excludeCollections) {
		throw new InvalidPayloadError({
			reason: `"includeCollections" and "excludeCollections" parameters cannot be used together`,
		});
	}

	if (!includeCollections && !excludeCollections) return null;

	const allCollections = Object.keys(schema.collections);

	if (includeCollections) {
		const knownCollections = new Set(allCollections);
		return includeCollections.filter((collection) => knownCollections.has(collection));
	}

	const excludedCollections = new Set(excludeCollections);
	return allCollections.filter((collection) => !excludedCollections.has(collection));
}
