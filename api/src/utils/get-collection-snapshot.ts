import type { CollectionSnapshot, Field, Relation, SchemaOverview } from '@directus/types';
import { version } from 'directus/version';
import type { Knex } from 'knex';
import { mapValues, omit, sortBy } from 'lodash-es';
import { ForbiddenError } from '@directus/errors';
import getDatabase from '../database/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from './get-schema.js';
import { sanitizeCollection, sanitizeField, sanitizeRelation, sanitizeSystemField } from './sanitize-schema.js';

export async function getCollectionSnapshot(
	collectionName: string,
	options?: { database?: Knex; schema?: SchemaOverview },
): Promise<CollectionSnapshot> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database, bypassCache: true }));

	const collectionsService = new CollectionsService({ knex: database, schema });
	const fieldsService = new FieldsService({ knex: database, schema });
	const relationsService = new RelationsService({ knex: database, schema });

	// Fetch collection
	const collections = await collectionsService.readByQuery();
	const collection = collections.find((c) => c.collection === collectionName);

	if (!collection) {
		throw new ForbiddenError({ reason: `Collection "${collectionName}" not found` });
	}

	// Fetch fields for this collection
	const fieldsRaw = await fieldsService.readAll(collectionName);

	// Fetch relations involving this collection (both as many and one side)
	const relationsRaw = await relationsService.readAll(collectionName);

	// Also fetch relations where this collection is on the "one" side (for M2M)
	const allRelationsRaw = await relationsService.readAll();
	const additionalRelations = allRelationsRaw.filter(
		(relation) => relation.meta?.one_collection === collectionName && relation.collection !== collectionName
	);

	const combinedRelations = [...relationsRaw, ...additionalRelations];

	// Filter fields: exclude system fields unless they have indexes
	const fieldsFiltered = fieldsRaw.filter((item) => !item.meta?.system);
	const systemFieldsFiltered = fieldsRaw.filter((item) => item.meta?.system === true && item.schema?.is_indexed);

	// Sort and sanitize fields
	const fieldsSorted = sortBy(mapValues(fieldsFiltered, sortDeep), ['meta.id']).map((field) =>
		sanitizeField(omitID(field) as Field),
	);

	const systemFieldsSorted = sortBy(systemFieldsFiltered, ['field']).map((field) => sanitizeSystemField(field));

	// Combine regular fields and system fields
	const allFields = [...fieldsSorted, ...systemFieldsSorted];

	// Filter relations: only include relations where this collection is the primary collection
	// Exclude junction relations that point back to this collection (they belong in the junction)
	const relationsFiltered = combinedRelations.filter((relation) => {
		// Include if this collection is the primary collection (where the relation is defined)
		if (relation.collection === collectionName) return true;

		// Include if this is a related m2o pointing to this collection from another non-junction collection
		if (relation.related_collection === collectionName && !relation.meta?.junction_field) return true;

		// Exclude M2M junction relations (they're handled via dependencies.junctions)
		return false;
	});

	// Sort and sanitize relations
	const relationsSorted = sortBy(mapValues(relationsFiltered, sortDeep), ['collection', 'field']).map((relation) =>
		sanitizeRelation(omitID(relation) as Relation),
	);

	// Sanitize collection
	const sanitizedCollection = sanitizeCollection(collection!);

	// Detect M2M relations and include junction collections
	// Use combinedRelations (unfiltered) to find M2M relations that were filtered out
	const junctionCollections = await detectM2MJunctions(
		collectionName,
		allFields,
		combinedRelations,
		{ database, schema, collectionsService, fieldsService, relationsService }
	);

	const snapshot: CollectionSnapshot = {
		version: 1,
		directus: version,
		collection: collectionName,
		meta: sanitizedCollection.meta || null,
		schema: sanitizedCollection.schema || { name: collectionName },
		fields: allFields,
		relations: relationsSorted,
	};

	// Add junctions if any were found
	if (junctionCollections.length > 0) {
		snapshot.dependencies = { junctions: junctionCollections };
	}

	return snapshot;
}

function omitID(item: Record<string, any>) {
	return omit(item, 'meta.id');
}

function sortDeep(raw: any): any {
	if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
		const sorted: Record<string, any> = {};
		const keys = Object.keys(raw).sort();

		for (const key of keys) {
			sorted[key] = sortDeep(raw[key]);
		}

		return sorted;
	}

	if (Array.isArray(raw)) {
		return raw.map((item) => sortDeep(item));
	}

	return raw;
}

/**
 * Detect M2M relations and fetch their junction collections
 */
async function detectM2MJunctions(
	_collectionName: string,
	fields: any[],
	relations: any[],
	services: { database: Knex; schema: SchemaOverview; collectionsService: any; fieldsService: any; relationsService: any }
): Promise<NonNullable<CollectionSnapshot['dependencies']>['junctions']> {
	const junctions: NonNullable<CollectionSnapshot['dependencies']>['junctions'] = [];

	// Find M2M alias fields
	const m2mFields = fields.filter(
		(f) => f.meta?.special && Array.isArray(f.meta.special) && f.meta.special.includes('m2m')
	);

	for (const m2mField of m2mFields) {
		// Find the relation that has this field as one_field (the M2M relation)
		const m2mRelation = relations.find(
			(r) => r.meta?.one_field === m2mField.field && r.meta?.junction_field
		);

		if (!m2mRelation) continue;

		const junctionCollection = m2mRelation.collection;

		// Avoid duplicates
		if (junctions.some((j: any) => j.collection === junctionCollection)) continue;

		// Fetch junction collection snapshot
		try {
			const collections = await services.collectionsService.readByQuery();
			const junction = collections.find((c: any) => c.collection === junctionCollection);

			if (!junction) continue;

			// Fetch junction fields
			const junctionFieldsRaw = await services.fieldsService.readAll(junctionCollection);
			const junctionFieldsFiltered = junctionFieldsRaw.filter((item: any) => !item.meta?.system);
			const junctionSystemFieldsFiltered = junctionFieldsRaw.filter(
				(item: any) => item.meta?.system === true && item.schema?.is_indexed
			);

			const junctionFieldsSorted = sortBy(mapValues(junctionFieldsFiltered, sortDeep), ['meta.id']).map(
				(field: any) => sanitizeField(omitID(field) as Field)
			);

			const junctionSystemFieldsSorted = sortBy(junctionSystemFieldsFiltered, ['field']).map((field: any) =>
				sanitizeSystemField(field)
			);

			const junctionAllFields = [...junctionFieldsSorted, ...junctionSystemFieldsSorted];

			// Fetch junction relations
			const junctionRelationsRaw = await services.relationsService.readAll(junctionCollection);
			const junctionRelationsFiltered = junctionRelationsRaw.filter(
				(relation: any) =>
					relation.collection === junctionCollection || relation.related_collection === junctionCollection
			);

			const junctionRelationsSorted = sortBy(mapValues(junctionRelationsFiltered, sortDeep), [
				'collection',
				'field',
			]).map((relation: any) => sanitizeRelation(omitID(relation) as Relation));

			const sanitizedJunction = sanitizeCollection(junction);

			junctions.push({
				collection: junctionCollection,
				meta: sanitizedJunction.meta || null,
				schema: sanitizedJunction.schema || { name: junctionCollection },
				fields: junctionAllFields,
				relations: junctionRelationsSorted,
			});
		} catch (error) {
			// Skip if junction collection can't be read
			continue;
		}
	}

	return junctions;
}
