import SchemaInspector from '@directus/schema';
import type { Accountability, CollectionOverview, FieldOverview, Filter, Relation, SchemaOverview } from '@directus/shared/types';
import { parseJSON, toArray } from '@directus/shared/utils';
import type { Knex } from 'knex';
import { getCache } from '../cache.js';
import { ALIAS_TYPES } from '../constants.js';
import getDatabase from '../database/index.js';
import { systemCollectionRows } from '../database/system-data/collections/index.js';
import { systemFieldRows } from '../database/system-data/fields/index.js';
import env from '../env.js';
import logger from '../logger.js';
import { RelationsService } from '../services/index.js';
import getDefaultValue from './get-default-value.js';
import getLocalType from './get-local-type.js';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	const database = options?.database || getDatabase();
	const schemaInspector = SchemaInspector(database);

	const {systemCache} = getCache()

	let result: SchemaOverview;

	if (env['CACHE_SCHEMA'] !== false) {
		return {
			getCollections: () => systemCache.autoCacheHash('collections', loadCollections),
			getCollection: (collection: string) => systemCache.autoCacheHashField('collections', collection, async () => await loadCollection(collection)),
			getFields: (collection: string) => systemCache.autoCacheHash(`fields:${collection}`, async () => await loadFields(collection)),
			getField: (collection: string, field: string) => systemCache.autoCacheHashField(`fields:${collection}`, field, async () => await loadField(collection, field)),
			getRelationsForCollection: (collection: string) => systemCache.autoCacheHash(`relations:${collection}`, async () => await loadRelationsForCollection(collection)),
			getRelationsForField: (collection: string, field: string) => systemCache.autoCacheHashField(`relations:${collection}`, field, async () => await loadRelationsForField(collection, field)),
			getPrimaryKeyField: async (collection: string) => {
				const collectionInfo = await systemCache.autoCacheHashField(`collections`, collection, async () => loadCollection(collection));
				return await systemCache.autoCacheHashField(`fields:${collection}`, collectionInfo!.primary, async () => loadField(collection, collectionInfo!.primary));
			},
			getRelations: async () => {
				const collections = await systemCache.autoCacheHash('collections', loadCollections);

				const result: Relation[] = []

				for(const collection of Object.keys(collections)) {
					const relations = await systemCache.autoCacheHash(`relations:${collection}`, async () => await loadRelationsForCollection(collection));
					result.push(...Object.values(relations))
				}

				return result
			}
		};
	} else {
		return {
			getCollections: loadCollections,
			getCollection: loadCollection,
			getFields: loadFields,
			getField: loadField,
			getRelationsForCollection: loadRelationsForCollection,
			getRelationsForField: loadRelationsForField,
			getPrimaryKeyField: async (collection: string) => {
				const collectionInfo = await loadCollection(collection);
				return await loadField(collection, collectionInfo!.primary);
			},
			getRelations: async () => {
				const collections = await loadCollections();

				const result: Relation[] = []

				for(const collection of Object.keys(collections)) {
					const relations = await loadRelationsForCollection(collection);
					result.push(...Object.values(relations))
				}

				return result
			}
		};
	}

	

	async function loadCollections() {
		const schemaOverview = await schemaInspector.overview();

		const result: Record<string, CollectionOverview> = {}
	
		const collections = [
			...(await database
				.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
				.from('directus_collections')),
			...systemCollectionRows,
		];
	
		for (const [collection, info] of Object.entries(schemaOverview)) {
			if (toArray(env['DB_EXCLUDE_TABLES']).includes(collection)) {
				logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
				continue;
			}
	
			if (!(info as any).primary) {
				logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
				continue;
			}
	
			if (collection.includes(' ')) {
				logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
				continue;
			}
	
			const collectionMeta = collections.find((collectionMeta) => collectionMeta.collection === collection);
	
			result[collection] = {
				collection,
				primary: (info as any).primary,
				singleton:
					collectionMeta?.singleton === true || collectionMeta?.singleton === 'true' || collectionMeta?.singleton === 1,
				note: collectionMeta?.note || null,
				sortField: collectionMeta?.sort_field || null,
				accountability: collectionMeta ? collectionMeta.accountability : 'all',
			};
		}

		return result;
	}

	async function loadCollection(collection: string) {
		const schemaOverview = await schemaInspector.overview();

		let collectionMeta: Record<string, any> | null = null;

		if(collection.startsWith('directus_')) {
			collectionMeta = systemCollectionRows.find((collectionMeta) => collectionMeta.collection === collection) ?? null;
		} else {
			collectionMeta = (await database
				.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
				.from('directus_collections').where('collection', collection))[0]
		}

		const info = schemaOverview[collection] || {};
	
		if (toArray(env['DB_EXCLUDE_TABLES']).includes(collection)) {
			logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
			return null;
		}

		if (!(info as any).primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			return null;
		}

		if (collection.includes(' ')) {
			logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
			return null;
		}

		return {
			collection,
			primary: (info as any).primary,
			singleton:
				collectionMeta?.['singleton'] === true || collectionMeta?.['singleton'] === 'true' || collectionMeta?.['singleton'] === 1,
			note: collectionMeta?.['note'] || null,
			sortField: collectionMeta?.['sort_field'] || null,
			accountability: collectionMeta ? collectionMeta['accountability'] : 'all',
		};
	}

	async function loadFields(collection: string) {
		const schemaOverview = await schemaInspector.overview();

		let fieldsInfo = Object.fromEntries(Object.values(schemaOverview[collection]!.columns).map((column) => {
			return [
				column.column_name,
				{
					field: column.column_name,
					defaultValue: getDefaultValue(column) ?? null,
					nullable: column.is_nullable ?? true,
					generated: column.is_generated ?? false,
					type: getLocalType(column),
					dbType: column.data_type,
					precision: column.numeric_precision || null,
					scale: column.numeric_scale || null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				}
			];
		}))

		let fields: {
			id: number;
			collection: string;
			field: string;
			special: string | string[] | null;
			note: string | null;
			validation: string | Record<string, any> | null;
		}[];

		if(collection.startsWith('directus_')) {
			fields = systemFieldRows.filter((field) => field.collection === collection);
		} else {
			fields = await database.select('id', 'collection', 'field', 'special', 'note', 'validation').from('directus_fields').where('collection', collection);
		}

		fields = fields.filter((field) => (field.special ? toArray(field.special)  : []).includes('no-data') === false);

		return fields.reduce<Record<string, FieldOverview>>((acc, field) => {
			const existing = fieldsInfo[field.field];
			const column = schemaOverview[field.collection]!.columns[field.field];
			const special = field.special ? toArray(field.special) : [];
	
			const type = (existing && getLocalType(column, { special })) || 'alias';
			let validation = field.validation ?? null;
			
			if (validation && typeof validation === 'string') validation = parseJSON(validation);
			
			if (ALIAS_TYPES.some((type) => special.includes(type)) === false && !existing) return acc;

			acc[field.field] = {
				field: field.field,
				defaultValue: existing?.defaultValue ?? null,
				nullable: existing?.nullable ?? true,
				generated: existing?.generated ?? false,
				type: type,
				dbType: existing?.dbType || null,
				precision: existing?.precision || null,
				scale: existing?.scale || null,
				special: special,
				note: field.note,
				alias: existing?.alias ?? true,
				validation: (validation as Filter) ?? null,
			}

			return acc
			
		}, {})
	}

	async function loadField(collection: string, fieldName: string) {
		const schemaOverview = await schemaInspector.overview();

		const info = schemaOverview[collection]!.columns[fieldName]!;

		let fieldInfo = {
			field: info.column_name,
			defaultValue: getDefaultValue(info) ?? null,
			nullable: info.is_nullable ?? true,
			generated: info.is_generated ?? false,
			type: getLocalType(info),
			dbType: info.data_type,
			precision: info.numeric_precision || null,
			scale: info.numeric_scale || null,
			special: [],
			note: null,
			validation: null,
			alias: false,
		}

		let field: {
			id: number;
			collection: string;
			field: string;
			special: string | string[] | null;
			note: string | null;
			validation: string | Record<string, any> | null;
		} | null;

		if(collection.startsWith('directus_')) {
			field = systemFieldRows.find((sysField) => sysField.collection === collection && sysField.field === fieldName) ?? null;
		} else {
			field = (await database.select('id', 'collection', 'field', 'special', 'note', 'validation').from('directus_fields').where('collection', collection).andWhere('field', fieldName))[0];
		}

		if(field === null || (field.special ? toArray(field.special)  : []).includes('no-data') == false) return null;

		const column = schemaOverview[field.collection]!.columns[field.field];
		const special = field.special ? toArray(field.special) : [];

		if (ALIAS_TYPES.some((type) => special.includes(type)) === false && !fieldInfo) return null;

		const type = (fieldInfo && getLocalType(column, { special })) || 'alias';
		let validation = field.validation ?? null;

		if (validation && typeof validation === 'string') validation = parseJSON(validation);

		return {
			field: field.field,
			defaultValue: fieldInfo?.defaultValue ?? null,
			nullable: fieldInfo?.nullable ?? true,
			generated: fieldInfo?.generated ?? false,
			type: type,
			dbType: fieldInfo?.dbType || null,
			precision: fieldInfo?.precision || null,
			scale: fieldInfo?.scale || null,
			special: special,
			note: field.note,
			alias: fieldInfo?.alias ?? true,
			validation: (validation as Filter) ?? null,
		};
	}

	async function loadRelationsForCollection(collection: string) {
		const relationsService = new RelationsService({ knex: database, schema: result });
		const relations = await relationsService.readAll(collection);

		return relations.reduce<Record<string, Relation>>((acc, relation) => {
			acc[relation.field] = relation;
			return acc
		}, {});
	}

	async function loadRelationsForField(collection: string, field: string) {
		const relationsService = new RelationsService({ knex: database, schema: result });
		return await relationsService.readOne(collection, field);
	}
}
