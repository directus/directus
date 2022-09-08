import getDatabase from '../database/index.js';
import { getSchema } from './get-schema.js';
import { CollectionsService, FieldsService, RelationsService } from '../services/index.js';
import type { Snapshot, SnapshotField, SnapshotRelation } from '../types/index.js';
import type { Knex } from 'knex';
import { omit, sortBy, toPairs, fromPairs, mapValues, isPlainObject, isArray } from 'lodash-es';
import type { SchemaOverview } from '@directus/shared/types';
import { importFile } from './importFile.js';

const version = JSON.parse(importFile('../package.json')).version;

export async function getSnapshot(options?: { database?: Knex; schema?: SchemaOverview }): Promise<Snapshot> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database }));

	const collectionsService = new CollectionsService({ knex: database, schema });
	const fieldsService = new FieldsService({ knex: database, schema });
	const relationsService = new RelationsService({ knex: database, schema });

	const [collectionsRaw, fieldsRaw, relationsRaw] = await Promise.all([
		collectionsService.readByQuery(),
		fieldsService.readAll(),
		relationsService.readAll(),
	]);

	const collectionsFiltered = collectionsRaw.filter((item: any) => excludeSystem(item));
	const fieldsFiltered = fieldsRaw.filter((item: any) => excludeSystem(item)).map(omitID) as SnapshotField[];
	const relationsFiltered = relationsRaw.filter((item: any) => excludeSystem(item)).map(omitID) as SnapshotRelation[];

	const collectionsSorted = sortBy(mapValues(collectionsFiltered, sortDeep), ['collection']);
	const fieldsSorted = sortBy(mapValues(fieldsFiltered, sortDeep), ['collection', 'field']);
	const relationsSorted = sortBy(mapValues(relationsFiltered, sortDeep), ['collection', 'field']);

	return {
		version: 1,
		directus: version,
		collections: collectionsSorted,
		fields: fieldsSorted,
		relations: relationsSorted,
	};
}

function excludeSystem(item: { meta?: { system?: boolean } }) {
	if (item?.meta?.system === true) return false;
	return true;
}

function omitID(item: Record<string, any>) {
	return omit(item, 'meta.id');
}

function sortDeep(raw: any): any {
	if (isPlainObject(raw)) {
		const mapped = mapValues(raw, sortDeep);
		const pairs = toPairs(mapped);
		const sorted = sortBy(pairs);
		return fromPairs(sorted);
	}

	if (isArray(raw)) {
		return sortBy(raw);
	}

	return raw;
}
