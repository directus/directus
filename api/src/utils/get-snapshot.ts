import type { Field, Relation, SchemaOverview, Snapshot } from '@directus/types';
import { version } from 'directus/version';
import type { Knex } from 'knex';
import { fromPairs, isArray, isPlainObject, mapValues, omit, sortBy, toPairs } from 'lodash-es';
import { SNAPSHOT_VERSION } from '../constants.js';
import getDatabase, { getDatabaseClient } from '../database/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from './get-schema.js';
import { isInScope } from './is-in-scope.js';
import { sanitizeCollection, sanitizeField, sanitizeRelation, sanitizeSystemField } from './sanitize-schema.js';

export interface GetSnapshotOptions {
	database?: Knex;
	schema?: SchemaOverview;
	/**
	 * Scope the snapshot to exactly these collections
	 */
	collections?: string[] | undefined;
}

/**
 * Build a snapshot of the current schema.
 *
 * @param options - Optional connection overrides and collection scoping.
 * @param options.database - Knex instance to read from; defaults to the shared connection.
 * @param options.schema - Pre-fetched schema overview; fetched fresh (cache bypassed) when omitted.
 * @param options.collections - Restrict the snapshot to these collections, producing a partial snapshot (version 2)
 * @returns The schema snapshot.
 */
export async function getSnapshot(options?: GetSnapshotOptions): Promise<Snapshot> {
	const database = options?.database ?? getDatabase();
	const vendor = getDatabaseClient(database);
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));

	const collectionsService = new CollectionsService({ knex: database, schema });
	const fieldsService = new FieldsService({ knex: database, schema });
	const relationsService = new RelationsService({ knex: database, schema });

	const [collectionsRaw, fieldsRaw, relationsRaw] = await Promise.all([
		collectionsService.readByQuery(),
		fieldsService.readAll(),
		relationsService.readAll(),
	]);

	const scope = options?.collections !== undefined ? new Set(options.collections) : null;

	const collectionsFiltered = collectionsRaw.filter(
		(item) => isNonSystem(item) && isManaged(item) && isInScope(item, scope),
	);

	const fieldsFiltered = fieldsRaw.filter((item) => isNonSystem(item) && isManaged(item) && isInScope(item, scope));

	const relationsFiltered = relationsRaw.filter(
		(item) => isNonSystem(item) && isManaged(item) && isInScope(item, scope),
	);

	const systemFieldsFiltered = fieldsRaw.filter((item) => isIndexedSystemField(item) && isInScope(item, scope));

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
		version: scope !== null ? SNAPSHOT_VERSION.PARTIAL : SNAPSHOT_VERSION.FULL,
		directus: version,
		vendor,
		collections: collectionsSorted,
		fields: fieldsSorted,
		systemFields: systemFieldsSorted,
		relations: relationsSorted,
	};
}

function isNonSystem(item: { meta: { system?: boolean | null } | null }) {
	if (item?.meta?.system === true) return false;
	return true;
}

function isIndexedSystemField(item: {
	meta: { system?: boolean | null } | null;
	schema: { is_indexed: boolean } | null;
}) {
	return item.meta?.system === true && item.schema?.is_indexed;
}

function isManaged(item: { meta: unknown | null } | null) {
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
