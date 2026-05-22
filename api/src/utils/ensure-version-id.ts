// Keep this in sync with app/src/utils/ensure-version-id.ts.
// versionsService.save requires a resolved version id, not a key.

import type { Item, PrimaryKey } from '@directus/types';
import type { VersionsService } from '../services/versions.js';

export async function ensureVersionId(
	versionsService: Pick<VersionsService, 'readByQuery' | 'createOne'>,
	ref: { collection: string; item: PrimaryKey; versionKey: string },
): Promise<PrimaryKey> {
	const existing = ((await versionsService.readByQuery({
		filter: {
			collection: { _eq: ref.collection },
			item: { _eq: String(ref.item) },
			key: { _eq: ref.versionKey },
		},
		limit: 1,
		fields: ['id'],
	})) ?? []) as Item[];

	if (existing.length > 0 && existing[0]?.['id'] !== undefined) {
		return existing[0]['id'] as PrimaryKey;
	}

	return versionsService.createOne({
		key: ref.versionKey,
		collection: ref.collection,
		item: String(ref.item),
	});
}
