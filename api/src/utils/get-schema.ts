import SchemaInspector from '@directus/schema';
import type { Accountability, CollectionMeta, CollectionOverview, FieldOverview, Filter, Relation, SchemaOverview } from '@directus/shared/types';
import { parseJSON, toArray } from '@directus/shared/utils';
import type { Knex } from 'knex';
import { getCache } from '../cache.js';
import { ALIAS_TYPES } from '../constants.js';
import getDatabase from '../database/index.js';
import { systemCollectionRows } from '../database/system-data/collections/index.js';
import { systemFieldRows } from '../database/system-data/fields/index.js';
import { systemRelationRows } from '../database/system-data/relations/index.js';
import env from '../env.js';
import logger from '../logger.js';
import getDefaultValue from './get-default-value.js';
import getLocalType from './get-local-type.js';
import { stitchRelations } from './stitch-relations.js';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	const database = options?.database || getDatabase();
	const schemaInspector = SchemaInspector(database);

	const {systemCache} = getCache()

	let result: SchemaOverview = {
		getCollections: () => useAutoCacheHash('collections', loadCollections),
		getCollection: (collection: string) => useAutoCacheHashField('collections', collection, async () => await loadCollection(collection)),
		getFields: (collection: string) => useAutoCacheHash(`fields:${collection}`, async () => await loadFields(collection)),
		getField: (collection: string, field: string) => useAutoCacheHashField(`fields:${collection}`, field, async () => await loadField(collection, field)),
		getRelationsForCollection: (collection: string) => useAutoCacheHash(`relations:${collection}`, async () => await loadRelationsForCollection(collection)),
		getRelationsForField: (collection: string, field: string) => useAutoCacheHashField(`relations:${collection}`, field, async () => await loadRelationsForField(collection, field)),
		getPrimaryKeyField: async (collection: string) => {
			const collectionInfo = await useAutoCacheHashField(`collections`, collection, async () => loadCollection(collection));
			return await useAutoCacheHashField(`fields:${collection}`, collectionInfo!.primary, async () => loadField(collection, collectionInfo!.primary));
		},
		getRelations: async () => {
			const collections = await useAutoCacheHash('collections', loadCollections);

			const result: Relation[] = []

			for(const collection of Object.keys(collections)) {
				const relations = await useAutoCacheHash(`relations:${collection}`, async () => await loadRelationsForCollection(collection));
				result.push(...Object.values(relations))
			}

			return result
		},
		hasCollection: async (collection: string) => {
			return await useAutoCacheHashField('hasCollection', collection, async () => await loadHasCollection(collection));
		},
		hasField: async (collection: string, field: string) => {
			return await useAutoCacheHashField(`hasField:${collection}`, field, async () => await loadHasField(collection, field));
		}
	}

	return result;

	async function useAutoCacheHash<T>(key: string, fn: () => Promise<Record<string, T>>): Promise<Record<string,T>> {
		// console.time(`getSchema:${key}`)

		let result

		if(env['CACHE_SCHEMA'] !== false) {
			result = await systemCache.autoCacheHash(key, fn);
		} else {
			result = await fn()
		}

		// console.timeEnd(`getSchema:${key}`)

		return result
	}

	async function useAutoCacheHashField<T>(key: string, field: string, fn: () => Promise<T>): Promise<T> {
		// console.time(`getSchemaField:${key}:${field}`)

		let result

		if(env['CACHE_SCHEMA'] !== false) {
			result = await systemCache.autoCacheHashField(key, field, fn);
		} else {
			result = await fn()
		}

		// console.timeEnd(`getSchemaField:${key}:${field}`)

		return result
	}

	async function loadCollections() {
		const schemaOverview = await schemaInspector.tableInfo()
		const primaryKeys = await schemaInspector.primary()

		const result: Record<string, CollectionOverview> = {}
	
		const collections = [
			...(await database
				.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
				.from('directus_collections')),
			...systemCollectionRows,
		];

		const collectionMeta = collections.reduce<Record<string, CollectionMeta>>((obj, collection) => ({ ...obj, [collection.collection]: collection }), {});
	
		for (const info of schemaOverview) {
			const collection = info.name;
			const primary = primaryKeys[collection];

			if (toArray(env['DB_EXCLUDE_TABLES']).includes(collection)) {
				logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
				continue;
			}
	
			if (!primary) {
				logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
				continue;
			}
	
			if (collection.includes(' ')) {
				logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
				continue;
			}
	
			result[collection] = {
				collection,
				primary,
				singleton:
					collectionMeta[collection]?.singleton === true,
				note: collectionMeta[collection]?.note || null,
				sortField: collectionMeta[collection]?.sort_field || null,
				accountability: collectionMeta ? collectionMeta[collection]!.accountability : 'all',
			};
		}

		return result;
	}

	async function loadCollection(collection: string) {
		const primary = await schemaInspector.primary(collection);

		let collectionMeta: Record<string, any> | null = null;

		if(collection.startsWith('directus_')) {
			collectionMeta = systemCollectionRows.find((collectionMeta) => collectionMeta.collection === collection) ?? null;
		} else {
			collectionMeta = (await database
				.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
				.from('directus_collections').where('collection', collection))[0]
		}
	
		if (toArray(env['DB_EXCLUDE_TABLES']).includes(collection)) {
			logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
			return null;
		}

		if (!primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			return null;
		}

		if (collection.includes(' ')) {
			logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
			return null;
		}

		return {
			collection,
			primary,
			singleton:
				collectionMeta?.['singleton'] === true || collectionMeta?.['singleton'] === 'true' || collectionMeta?.['singleton'] === 1,
			note: collectionMeta?.['note'] || null,
			sortField: collectionMeta?.['sort_field'] || null,
			accountability: collectionMeta ? collectionMeta['accountability'] : 'all',
		};
	}

	async function loadHasCollection(collection: string) {
		return await schemaInspector.hasTable(collection);
	}

	async function loadHasField(collection: string, field: string) {
		return await schemaInspector.hasColumn(collection, field);
	}

	async function loadFields(collection: string) {
		const columns = await schemaInspector.columnInfo(collection);

		let fieldsInfo = Object.fromEntries(columns.map((column) => {
			return [
				column.name,
				{
					field: column.name,
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
			const column = columns.find(column => column.name === field.field);
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
		const column = await schemaInspector.columnInfo(collection, fieldName);

		let fieldInfo = {
			field: column.name,
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

		if(field === null || (field.special ? toArray(field.special)  : []).includes('no-data')) return null;

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
		let metaRows = [
			...await database
				.select('id','many_collection','many_field','one_collection','one_field','one_collection_field','one_allowed_collections','junction_field','sort_field','one_deselect_action')
				.from('directus_relations').where('many_collection', collection),
			...systemRelationRows.filter((fieldMeta) => fieldMeta.many_collection === collection)
		]

		const schemaRows = await schemaInspector.foreignKeys(collection);
		const relations = stitchRelations(metaRows, schemaRows);

		return relations.reduce<Record<string, Relation>>((acc, relation) => {
			acc[relation.field] = relation;
			return acc
		}, {});
	}

	async function loadRelationsForField(collection: string, field: string) {
		let metaRows = [
			...await database
				.select('id','many_collection','many_field','one_collection','one_field','one_collection_field','one_allowed_collections','junction_field','sort_field','one_deselect_action')
				.from('directus_relations').where('many_collection', collection).andWhere('many_field', field),
			...systemRelationRows.filter((fieldMeta) => fieldMeta.many_collection === collection && fieldMeta.many_field === field)
		]

		const schemaRows = (await schemaInspector.foreignKeys(collection)).filter((row) => row.column === field && row.table === collection);
		const relations = stitchRelations(metaRows, schemaRows);

		return relations[0] ?? null;
	}
}
