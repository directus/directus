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

async function getFields(keys: { collection: string; field: string }[]) {
	const records = await database
		.select('*')
		.from('directus_fields')
		.whereIn(
			['collection', 'field'],
			keys.map((key) => [key.collection, key.field])
		);

	return keys.map<FieldInfo>((key) =>
		records.find((record) => record.collection === key.collection && record.field === key.field)
	);
}

export default function createSystemLoaders() {
	return {
		collections: new DataLoader(getCollections),
		fields: new DataLoader(getFields, {
			cacheKeyFn: (key: { collection: string; field: string }) =>
				key.collection + '__' + key.field,
		}),
	};
}
