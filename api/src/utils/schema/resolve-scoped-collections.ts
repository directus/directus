import { InvalidPayloadError } from '@directus/errors';
import type { SnapshotScope } from '@directus/types';
import type { Collection } from '../../types/index.js';

/**
 * Resolves a collection scope into a list of collections a partial snapshot should contain. Names not present in the
 * given collections are ignored.
 *
 * @param collections - Every collection known to Directus, folders included.
 * @param scope - The requested scope; `includeCollections` and `excludeCollections` are mutually exclusive.
 * @param scope.includeCollections - Restrict the snapshot to exactly these collections.
 * @param scope.excludeCollections - Include every collection except these.
 * @returns The collections to snapshot, or `null` for a full snapshot
 * @throws {InvalidPayloadError} If both `includeCollections` and `excludeCollections` are provided.
 */
export function resolveScopedCollections(collections: Collection[], scope: SnapshotScope): string[] | null {
	const { includeCollections, excludeCollections } = scope;

	if (includeCollections && excludeCollections) {
		throw new InvalidPayloadError({
			reason: `"includeCollections" and "excludeCollections" parameters cannot be used together`,
		});
	}

	if (!includeCollections && !excludeCollections) return null;

	const allCollections = collections.map(({ collection }) => collection);

	if (includeCollections) {
		const knownCollections = new Set(allCollections);
		return includeCollections.filter((collection) => knownCollections.has(collection));
	}

	const excludedCollections = new Set(excludeCollections);
	return allCollections.filter((collection) => !excludedCollections.has(collection));
}
