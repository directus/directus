import type { CollectionSnapshot, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { useLogger } from '../logger/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';

/**
 * Apply a collection snapshot additively - only creates/updates the target collection
 * without affecting other collections. This is in contrast to applySnapshot which
 * performs a full schema replacement.
 *
 * Features:
 * - Creates collection if it doesn't exist
 * - Updates collection metadata if it exists (merge mode)
 * - Adds new fields, updates existing fields (preserves extra fields)
 * - Creates relations only if target collections exist
 * - Never deletes or modifies other collections
 *
 * @param snapshot - Collection snapshot to import
 * @param options - Import options
 */
export async function applyCollectionAdditive(
	snapshot: CollectionSnapshot,
	options: { database: Knex; schema: SchemaOverview; merge?: boolean },
): Promise<void> {
	const { database, schema, merge = true } = options;
	const logger = useLogger();

	// Service for collection operations
	const collectionsService = new CollectionsService({ knex: database, schema });

	// 1. Check if collection exists
	let collectionExists = false;

	try {
		await collectionsService.readOne(snapshot.collection);
		collectionExists = true;
	} catch {
		// Collection doesn't exist
	}

	if (collectionExists) {
		if (!merge) {
			throw new Error(`Collection "${snapshot.collection}" already exists. Use --force to merge.`);
		}

		// Update collection metadata
		logger.info(`Updating collection metadata: ${snapshot.collection}`);

		await collectionsService.updateOne(snapshot.collection, {
			meta: snapshot.meta,
		});
	} else {
		// Create new collection
		logger.info(`Creating collection: ${snapshot.collection}`);

		await collectionsService.createOne({
			collection: snapshot.collection,
			meta: snapshot.meta,
			schema: snapshot.schema,
		});
	}

	// Refresh schema after collection creation/update to ensure it includes the new collection
	const { getSchema } = await import('../utils/get-schema.js');
	const updatedSchema = await getSchema({ database, bypassCache: true });

	// Recreate services with updated schema
	const fieldsServiceWithSchema = new FieldsService({ knex: database, schema: updatedSchema });

	// 2. Apply fields (additive - keep existing fields)
	// Separate relation fields from regular fields
	const relationFields: any[] = [];
	const regularFields = snapshot.fields.filter((f) => {
		if (isSystemField(f)) return false;
		if (!('type' in f) || !f.type) return false;

		// Check if this is a relation field
		const special = f.meta?.special;
		if (special && Array.isArray(special)) {
			const hasRelationSpecial = special.some((s: string) => ['m2o', 'o2m', 'm2m', 'translations'].includes(s));
			if (hasRelationSpecial) {
				relationFields.push(f);
				return false;
			}
		}

		return true;
	});

	// First, create/update regular fields
	for (const field of regularFields) {
		// Type narrowing - we know this is a regular field with type
		if (!('type' in field) || !field.type) continue;

		let fieldExists = false;

		try {
			await fieldsServiceWithSchema.readOne(snapshot.collection, field.field);
			fieldExists = true;
		} catch {
			// Field doesn't exist
		}

		if (fieldExists) {
			// Check for type changes (block dangerous changes)
			try {
				const existingField = await fieldsServiceWithSchema.readOne(snapshot.collection, field.field);
			const fieldType = field['type'];
			const existingType = existingField['type'];


				if (existingType !== fieldType) {
					logger.warn(
						`Cannot change type of field "${field.field}" from "${existingType}" to "${fieldType}" - skipping field update`,
					);

					continue;
				}

				// Update field metadata (safe changes only)
				logger.info(`Updating field: ${snapshot.collection}.${field.field}`);

				await fieldsServiceWithSchema.updateField(snapshot.collection, {
					field: field.field,
					type: fieldType,
					meta: field.meta,
					// Don't update schema to prevent type changes
				});
			} catch (error: any) {
				logger.warn(`Failed to update field "${field.field}": ${error.message}`);
			}
		} else {
			// Create new field
			logger.info(`Creating field: ${snapshot.collection}.${field.field}`);

			try {
				await fieldsServiceWithSchema.createField(snapshot.collection, field as any);
			} catch (error: any) {
				logger.error(`Failed to create field "${field.field}": ${error.message}`);
				throw error;
			}
		}
	}

	// 3. Create relation fields (the underlying columns for m2o fields)
	// These need to exist before we can create the relation metadata
	for (const field of relationFields) {
		if (!('type' in field) || !field.type) continue;

		// Only create m2o fields here (o2m and m2m are aliases, not real columns)
		const special = field.meta?.special;
		if (!special || !special.includes('m2o')) continue;

		let fieldExists = false;

		try {
			await fieldsServiceWithSchema.readOne(snapshot.collection, field.field);
			fieldExists = true;
		} catch {
			// Field doesn't exist
		}

		if (!fieldExists) {
			logger.info(`Creating relation field: ${snapshot.collection}.${field.field}`);

			try {
				await fieldsServiceWithSchema.createField(snapshot.collection, field as any);
			} catch (error: any) {
				logger.error(`Failed to create relation field "${field.field}": ${error.message}`);
				throw error;
			}
		}
	}

	// Refresh schema again after creating relation fields
	const schemaAfterFields = await getSchema({ database, bypassCache: true });
	const relationsServiceFinal = new RelationsService({ knex: database, schema: schemaAfterFields });

	// 4. Apply relations (only if target collections exist)
	const allCollections = await collectionsService.readByQuery();
	const collectionNames = new Set(allCollections.map((c) => c.collection));

	for (const relation of snapshot.relations) {
		// Check if related collection exists
		if (relation.related_collection && !collectionNames.has(relation.related_collection)) {
			logger.warn(
				`Skipping relation "${relation.collection}.${relation.field}" → "${relation.related_collection}" - target collection not found`,
			);

			continue;
		}

		let relationExists = false;

		try {
			await relationsServiceFinal.readOne(relation.collection, relation.field);
			relationExists = true;
		} catch {
			// Relation doesn't exist
		}

		if (relationExists) {
			// Update existing relation
			logger.info(`Updating relation: ${relation.collection}.${relation.field}`);

			try {
				await relationsServiceFinal.updateOne(relation.collection, relation.field, {
					related_collection: relation.related_collection,
					meta: relation.meta,
					schema: relation.schema,
				});
			} catch (error: any) {
				logger.warn(`Failed to update relation "${relation.field}": ${error.message}`);
			}
		} else {
			// Create new relation
			logger.info(
				`Creating relation: ${relation.collection}.${relation.field} → ${relation.related_collection}`,
			);

			try {
				await relationsServiceFinal.createOne({
					collection: relation.collection,
					field: relation.field,
					related_collection: relation.related_collection,
					meta: relation.meta,
					schema: relation.schema,
				});
			} catch (error: any) {
				logger.error(`Failed to create relation "${relation.field}": ${error.message}`);
				throw error;
			}
		}
	}

	// 5. Apply junction collections for M2M relations
	if (snapshot.dependencies?.junctions) {
		for (const junction of snapshot.dependencies.junctions) {
			// Check if ALL required collections exist before creating junction
			const requiredCollections = extractRequiredCollectionsFromJunction(junction);
			const currentCollections = await collectionsService.readByQuery();
			const currentCollectionNames = new Set(currentCollections.map((c: any) => c.collection));

			const missingCollections = requiredCollections.filter((c) => !currentCollectionNames.has(c));

			if (missingCollections.length > 0) {
				logger.warn(
					`Skipping junction "${junction.collection}" - missing required collections: ${missingCollections.join(', ')}`
				);
				continue;
			}

			// All dependencies exist, create junction collection
			logger.info(`Creating junction collection: ${junction.collection}`);

			try {
				await applyCollectionAdditive(
					{
						version: snapshot.version,
						directus: snapshot.directus,
						collection: junction.collection,
						meta: junction.meta,
						schema: junction.schema,
						fields: junction.fields,
						relations: junction.relations,
					},
					{ database, schema, merge: true }
				);
			} catch (error: any) {
				logger.warn(`Failed to create junction "${junction.collection}": ${error.message}`);
			}
		}
	}

	// 6. Create M2M alias fields (only if their junctions were created successfully)
	const m2mAliasFields = relationFields.filter((f) => {
		const special = f.meta?.special;
		return special && special.includes('m2m');
	});

	for (const aliasField of m2mAliasFields) {
		// Find the junction relation - it might be in snapshot.relations OR in junction.relations
		let relatedRelation = snapshot.relations.find(
			(r) => r.meta?.one_field === aliasField.field
		);

		// If not found in main relations, search in junction relations
		if (!relatedRelation && snapshot.dependencies?.junctions) {
			for (const junction of snapshot.dependencies.junctions) {
				relatedRelation = junction.relations.find(
					(r) => r.meta?.one_field === aliasField.field
				);
				if (relatedRelation) break;
			}
		}

		if (!relatedRelation) {
			logger.warn(`Skipping M2M alias field "${aliasField.field}" - no related relation found`);
			continue;
		}

		const junctionCollection = relatedRelation.collection;
		const refreshedCollections = await collectionsService.readByQuery();
		const junctionExists = refreshedCollections.some((c: any) => c.collection === junctionCollection);

		if (!junctionExists) {
			logger.warn(
				`Skipping M2M alias field "${aliasField.field}" - junction collection "${junctionCollection}" not found`
			);
			continue;
		}

		// Create the alias field
		logger.info(`Creating M2M alias field: ${snapshot.collection}.${aliasField.field}`);

		try {
			const finalSchema = await getSchema({ database, bypassCache: true });
			const finalFieldsService = new FieldsService({ knex: database, schema: finalSchema });

			await finalFieldsService.createField(snapshot.collection, aliasField as any);
		} catch (error: any) {
			logger.warn(`Failed to create M2M alias field "${aliasField.field}": ${error.message}`);
		}
	}

	// Note: Cache clearing and event emission are handled automatically by the services
	logger.info('✓ Schema changes applied. Refresh Studio to see updates.');
}

/**
 * Extract required collection names from a junction collection's relations
 */
function extractRequiredCollectionsFromJunction(junction: any): string[] {
	const collections = new Set<string>();

	// Add the junction's related collections from relations
	for (const relation of junction.relations || []) {
		if (relation.related_collection) {
			collections.add(relation.related_collection);
		}
	}

	return Array.from(collections);
}

/**
 * Check if a field is a system field (indexed system field)
 */
function isSystemField(field: any): boolean {
	return 'schema' in field && field.schema && 'is_indexed' in field.schema && !field.type;
}
