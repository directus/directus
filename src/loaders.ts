/**
 * Loaders are individual DataLoader instances that can be used to query often used information more
 * efficiently. This is relied on for fetching field information for example, seeing that's an
 * operation we'll do often in various middleware checks
 */

import DataLoader from 'dataloader';
import { FieldInfo } from './types/field';
import database from './database';

async function getCollections(keys: string[]) {
	const records = await database
		.select('*')
		.from('directus_collections')
		.whereIn('collection', keys);

	return keys.map((key) => records.find((collection) => collection.collection === key));
}

export default function createSystemLoaders() {
	return {
		collections: new DataLoader(getCollections),
		fieldsByCollection: new DataLoader<string, FieldInfo[]>((collections: string[]) =>
			database
				.select('*')
				.from('directus_fields')
				.whereIn('collection', collections)
				.then((rows) =>
					collections.map((collection) => rows.filter((x) => x.collection === collection))
				)
		),
	};
}
