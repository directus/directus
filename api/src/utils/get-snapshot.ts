import type { Field, Relation, SchemaOverview, Snapshot } from '@directus/types';
import { version } from 'directus/version';
import type { Knex } from 'knex';
import { fromPairs, isArray, isPlainObject, mapValues, omit, sortBy, toPairs } from 'lodash-es';
import getDatabase, { getDatabaseClient } from '../database/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from './get-schema.js';
import { sanitizeCollection, sanitizeField, sanitizeRelation, sanitizeSystemField } from './sanitize-schema.js';

export async function getSnapshot(options?: {
	database?: Knex;
	schema?: SchemaOverview;
	includeUntracked?: boolean | undefined;
}): Promise<Snapshot> {
	const database = options?.database ?? getDatabase();
	const vendor = getDatabaseClient(database);
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));
	const includeUntracked = options?.includeUntracked ?? false;

	const collectionsService = new CollectionsService({ knex: database, schema });
	const fieldsService = new FieldsService({ knex: database, schema });
	const relationsService = new RelationsService({ knex: database, schema });

	const [collectionsRaw, fieldsRaw, relationsRaw] = await Promise.all([
		collectionsService.readByQuery(),
		fieldsService.readAll(),
		relationsService.readAll(),
	]);

	const collectionsFiltered = collectionsRaw.filter(
		(item) => excludeSystem(item) && (includeUntracked || excludeUntracked(item)),
	);

	const fieldsFiltered = fieldsRaw.filter(
		(item) => excludeSystem(item) && (includeUntracked || excludeUntracked(item)),
	);

	const relationsFiltered = relationsRaw.filter(
		(item) => excludeSystem(item) && (includeUntracked || excludeUntracked(item)),
	);

	const systemFieldsFiltered = fieldsRaw.filter((item) => systemFieldWithIndex(item));

	const collectionsSorted = sortBy(mapValues(collectionsFiltered, sortDeep), ['collection']).map((collection) =>
		sanitizeCollection(collection),
	);

	const fieldsSorted = sortBy(mapValues(fieldsFiltered, sortDeep), ['collection', 'meta.id']).map((field) =>
		sanitizeField(omitID(field) as Field),
	);

	const systemFieldsSorted = sortBy(systemFieldsFiltered, ['collection', 'field']).map((field) =>
		sanitizeSystemField(field),
	);

	const relationsSorted = sortBy(mapValues(relationsFiltered, sortDeep), ['collection', 'meta.id']).map((relation) =>
		sanitizeRelation(omitID(relation) as Relation),
	);

	return {
		version: 1,
		directus: version,
		vendor,
		collections: collectionsSorted,
		fields: fieldsSorted,
		systemFields: systemFieldsSorted,
		relations: relationsSorted,
	};
}

function excludeSystem(item: { meta: { system?: boolean | null } | null }) {
	if (item?.meta?.system === true) return false;
	return true;
}

function systemFieldWithIndex(item: {
	meta: { system?: boolean | null } | null;
	schema: { is_indexed: boolean } | null;
}) {
	return item.meta?.system === true && item.schema?.is_indexed;
}

function excludeUntracked(item: { meta: unknown | null } | null) {
	if (item?.meta === null) return false;
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
		return (raw as any[]).map((raw) => sortDeep(raw));
	}

	return raw;
}
