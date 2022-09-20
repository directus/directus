import SchemaInspector from '@directus/schema';
import { Filter, SchemaOverview } from '@directus/shared/types';
import { parseJSON, toArray } from '@directus/shared/utils';
import { Knex } from 'knex';
import { mapValues } from 'lodash';
import { getSystemCache, setSystemCache } from '../cache';
import { ALIAS_TYPES } from '../constants';
import getDatabase from '../database';
import { systemCollectionRows } from '../database/system-data/collections';
import { systemFieldRows } from '../database/system-data/fields';
import env from '../env';
import logger from '../logger';
import { RelationsService } from '../services';
import getDefaultValue from './get-default-value';
import getLocalType from './get-local-type';

export async function getSchema(options?: {
	database?: Knex;

	/**
	 * To bypass any cached schema if bypassCache is enabled.
	 * Used to ensure schema snapshot/apply is not using outdated schema
	 */
	bypassCache?: boolean;
}): Promise<SchemaOverview> {
	const database = options?.database || getDatabase();
	const schemaInspector = SchemaInspector(database);

	const {systemCache} = getCache()

	let result: SchemaOverview;

	if (!options?.bypassCache && env.CACHE_SCHEMA !== false) {
		let cachedSchema;

		try {
			cachedSchema = (await getSystemCache('schema')) as SchemaOverview;
		} catch (err: any) {
			logger.warn(err, `[schema-cache] Couldn't retrieve cache. ${err}`);
		}

		if (cachedSchema) {
			result = cachedSchema;
		} else {
			result = await getDatabaseSchema(database, schemaInspector);

			try {
				await setSystemCache('schema', result);
			} catch (err: any) {
				logger.warn(err, `[schema-cache] Couldn't save cache. ${err}`);
			}
		}
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

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (toArray(env.DB_EXCLUDE_TABLES).includes(collection)) {
			logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
			return null;
		}

		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			return null;
		}

		if (collection.includes(' ')) {
			logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
			return null;
		}

		return {
			collection,
			primary: info.primary,
			singleton:
				collectionMeta?.singleton === true || collectionMeta?.singleton === 'true' || collectionMeta?.singleton === 1,
			note: collectionMeta?.note || null,
			sortField: collectionMeta?.sort_field || null,
			accountability: collectionMeta ? collectionMeta.accountability : 'all',
			fields: mapValues(schemaOverview[collection].columns, (column) => {
				return {
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

		if(field === null || (field.special ? toArray(field.special)  : []).includes('no-data')) return null;

		const existing = result.collections[field.collection].fields[field.field];
		const column = schemaOverview[field.collection].columns[field.field];
		const special = field.special ? toArray(field.special) : [];

		if (ALIAS_TYPES.some((type) => special.includes(type)) === false && !fieldInfo) return null;

		const type = (fieldInfo && getLocalType(column, { special })) || 'alias';
		let validation = field.validation ?? null;

		if (validation && typeof validation === 'string') validation = parseJSON(validation);

		result.collections[field.collection].fields[field.field] = {
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
