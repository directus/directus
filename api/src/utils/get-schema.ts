import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Filter, SchemaOverview } from '@directus/types';
import { parseJSON, toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { mapValues } from 'lodash-es';
import { getSchemaCache, setSchemaCache } from '../cache.js';
import { ALIAS_TYPES } from '../constants.js';
import getDatabase from '../database/index.js';
import { systemCollectionRows } from '../database/system-data/collections/index.js';
import { systemFieldRows } from '../database/system-data/fields/index.js';
import { useEnv } from '../env.js';
import { useLogger } from '../logger.js';
import { RelationsService } from '../services/relations.js';
import getDefaultValue from './get-default-value.js';
import getLocalType from './get-local-type.js';

const logger = useLogger();

export async function getSchema(options?: {
	database?: Knex;

	/**
	 * To bypass any cached schema if bypassCache is enabled.
	 * Used to ensure schema snapshot/apply is not using outdated schema
	 */
	bypassCache?: boolean;
}): Promise<SchemaOverview> {
	const env = useEnv();

	const database = options?.database || getDatabase();
	const schemaInspector = createInspector(database);

	let result: SchemaOverview;

	if (!options?.bypassCache && env['CACHE_SCHEMA'] !== false) {
		let cachedSchema;

		try {
			cachedSchema = await getSchemaCache();
		} catch (err: any) {
			logger.warn(err, `[schema-cache] Couldn't retrieve cache. ${err}`);
		}

		if (cachedSchema) {
			result = cachedSchema;
		} else {
			result = await getDatabaseSchema(database, schemaInspector);

			try {
				await setSchemaCache(result);
			} catch (err: any) {
				logger.warn(err, `[schema-cache] Couldn't save cache. ${err}`);
			}
		}
	} else {
		result = await getDatabaseSchema(database, schemaInspector);
	}

	return result;
}

async function getDatabaseSchema(database: Knex, schemaInspector: SchemaInspector): Promise<SchemaOverview> {
	const env = useEnv();

	const result: SchemaOverview = {
		collections: {},
		relations: [],
	};

	const schemaOverview = await schemaInspector.overview();

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

		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			continue;
		}

		if (collection.includes(' ')) {
			logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
			continue;
		}

		const collectionMeta = collections.find((collectionMeta) => collectionMeta.collection === collection);

		result.collections[collection] = {
			collection,
			primary: info.primary,
			singleton:
				collectionMeta?.singleton === true || collectionMeta?.singleton === 'true' || collectionMeta?.singleton === 1,
			note: collectionMeta?.note || null,
			sortField: collectionMeta?.sort_field || null,
			accountability: collectionMeta ? collectionMeta.accountability : 'all',
			fields: mapValues(schemaOverview[collection]?.columns, (column) => {
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
				};
			}),
		};
	}

	const fields = [
		...(await database
			.select<
				{
					id: number;
					collection: string;
					field: string;
					special: string;
					note: string | null;
					validation: string | Record<string, any> | null;
				}[]
			>('id', 'collection', 'field', 'special', 'note', 'validation')
			.from('directus_fields')),
		...systemFieldRows,
	].filter((field) => (field.special ? toArray(field.special) : []).includes('no-data') === false);

	for (const field of fields) {
		if (!result.collections[field.collection]) continue;

		const existing = result.collections[field.collection]?.fields[field.field];
		const column = schemaOverview[field.collection]?.columns[field.field];
		const special = field.special ? toArray(field.special) : [];

		if (ALIAS_TYPES.some((type) => special.includes(type)) === false && !existing) continue;

		const type = (existing && getLocalType(column, { special })) || 'alias';
		let validation = field.validation ?? null;

		if (validation && typeof validation === 'string') validation = parseJSON(validation);

		result.collections[field.collection]!.fields[field.field] = {
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
		};
	}

	const relationsService = new RelationsService({ knex: database, schema: result });
	result.relations = await relationsService.readAll();

	return result;
}
