import { useEnv } from '@directus/env';
import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import { systemCollectionRows } from '@directus/system-data';
import type { Filter, SchemaOverview } from '@directus/types';
import { parseJSON, toArray, toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { mapValues } from 'lodash-es';
import { useBus } from '../bus/index.js';
import { getMemorySchemaCache, setMemorySchemaCache } from '../cache.js';
import { ALIAS_TYPES } from '../constants.js';
import getDatabase from '../database/index.js';
import { useLock } from '../lock/index.js';
import { useLogger } from '../logger/index.js';
import { RelationsService } from '../services/relations.js';
import getDefaultValue from './get-default-value.js';
import { getSystemFieldRowsWithAuthProviders } from './get-field-system-rows.js';
import getLocalType from './get-local-type.js';

const logger = useLogger();

export async function getSchema(
	options?: {
		database?: Knex;

		/**
		 * To bypass any cached schema if bypassCache is enabled.
		 * Used to ensure schema snapshot/apply is not using outdated schema
		 */
		bypassCache?: boolean;
	},
	attempt = 0,
): Promise<SchemaOverview> {
	const MAX_ATTEMPTS = 3;

	const env = useEnv();

	if (options?.bypassCache || env['CACHE_SCHEMA'] === false) {
		const database = options?.database || getDatabase();
		const schemaInspector = createInspector(database);

		return await getDatabaseSchema(database, schemaInspector);
	}

	const cached = getMemorySchemaCache();

	if (cached) {
		return cached;
	}

	if (attempt >= MAX_ATTEMPTS) {
		throw new Error(`Failed to get Schema information: hit infinite loop`);
	}

	const lock = useLock();
	const bus = useBus();

	const lockKey = 'schemaCache--preparing';
	const messageKey = 'schemaCache--done';
	const processId = await lock.increment(lockKey);

	if (processId >= (env['CACHE_SCHEMA_MAX_ITERATIONS'] as number)) {
		await lock.delete(lockKey);
	}

	const currentProcessShouldHandleOperation = processId === 1;

	if (currentProcessShouldHandleOperation === false) {
		logger.trace('Schema cache is prepared in another process, waiting for result.');

		const timeout: Promise<any> = new Promise((_, reject) =>
			setTimeout(reject, env['CACHE_SCHEMA_SYNC_TIMEOUT'] as number),
		);

		const subscription = new Promise<SchemaOverview>((resolve, reject) => {
			bus.subscribe(messageKey, busListener).catch(reject);

			function busListener(options: { schema: SchemaOverview | null }) {
				cleanup();

				if (options.schema === null) {
					return reject();
				}

				try {
					setMemorySchemaCache(options.schema);
					resolve(options.schema);
				} catch (e) {
					reject(e);
				}
			}

			function cleanup() {
				bus.unsubscribe(messageKey, busListener).catch(reject);
			}
		});

		return Promise.race([timeout, subscription]).catch(() => getSchema(options, attempt + 1));
	}

	let schema: SchemaOverview | null = null;

	try {
		const database = options?.database || getDatabase();
		const schemaInspector = createInspector(database);

		schema = await getDatabaseSchema(database, schemaInspector);
		setMemorySchemaCache(schema);
		return schema;
	} finally {
		await bus.publish(messageKey, { schema });
		await lock.delete(lockKey);
	}
}

async function getDatabaseSchema(database: Knex, schemaInspector: SchemaInspector): Promise<SchemaOverview> {
	const env = useEnv();

	const result: SchemaOverview = {
		collections: {},
		relations: [],
	};

	const systemFieldRows = getSystemFieldRowsWithAuthProviders();

	const schemaOverview = await schemaInspector.overview();

	const collections = [
		...(await database
			.select('collection', 'singleton', 'note', 'sort_field', 'accountability', 'versioning')
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
			singleton: toBoolean(collectionMeta?.singleton),
			versioning: toBoolean(collectionMeta?.versioning),
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
					searchable: true,
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
					searchable: boolean;
				}[]
			>('id', 'collection', 'field', 'special', 'note', 'validation', 'searchable')
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
			searchable: toBoolean(field.searchable) ?? true,
		};
	}

	const relationsService = new RelationsService({ knex: database, schema: result });
	result.relations = await relationsService.readAll(undefined, undefined, true);

	return result;
}
