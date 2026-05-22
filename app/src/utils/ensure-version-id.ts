// Keep this in sync with api/src/utils/ensure-version-id.ts.
// Phase 1 bridge: AI/visual paths only have { collection, item, versionKey }, but
// /versions/save needs a version id. Phase 2 will accept version keys directly.

import type { PrimaryKey } from '@directus/types';
import type { AxiosInstance } from 'axios';

export async function ensureVersionId(
	client: AxiosInstance,
	ref: { collection: string; item: PrimaryKey; versionKey: string },
): Promise<PrimaryKey> {
	const {
		data: { data: existing },
	} = await client.get('/versions', {
		params: {
			filter: {
				collection: { _eq: ref.collection },
				item: { _eq: String(ref.item) },
				key: { _eq: ref.versionKey },
			},
			limit: 1,
			fields: ['id'],
		},
	});

	if (existing.length > 0 && existing[0]?.id !== undefined) return existing[0].id;

	const {
		data: { data: created },
	} = await client.post('/versions', {
		key: ref.versionKey,
		collection: ref.collection,
		item: String(ref.item),
	});

	return created.id;
}
