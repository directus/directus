import SchemaInspector from '@directus/schema';
import { Knex } from 'knex';
import { getCache } from '../cache';
import { ALIAS_TYPES } from '../constants';
import getDatabase, { getSchemaInspector } from '../database';
import { systemCollectionRows } from '../database/system-data/collections';
import env from '../env';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import logger from '../logger';
import { FieldsService } from '../services/fields';
import { ItemsService, MutationOptions } from '../services/items';
import Keyv from 'keyv';
import { AbstractServiceOptions, Collection, CollectionMeta, SchemaOverview } from '../types';
import { Accountability, FieldMeta, RawField } from '@directus/shared/types';

export type RawCollection = {
	collection: string;
	fields?: RawField[];
	meta?: Partial<CollectionMeta> | null;
};

export class CollectionsService {
	knex: Knex;
	accountability: Accountability | null;
	schemaInspector: ReturnType<typeof SchemaInspector>;
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	schemaCache: Keyv<any> | null;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schemaInspector = options.knex ? SchemaInspector(options.knex) : getSchemaInspector();
		this.schema = options.schema;

		const { cache, schemaCache } = getCache();
		this.cache = cache;
		this.schemaCache = schemaCache;
	}

	/**
	 * Create a single new collection
	 */
	async createOne(payload: RawCollection, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		if (!payload.collection) throw new InvalidPayloadException(`"collection" is required`);

		// Directus heavily relies on the primary key of a collection, so we have to make sure that
		// every collection that is created has a primary key. If no primary key field is created
		// while making the collection, we default to an auto incremented id named `id`
		if (!payload.fields)
			payload.fields = [
				{
					field: 'id',
					type: 'integer',
					meta: {
						hidden: true,
						interface: 'numeric',
						readonly: true,
					},
					schema: {
						is_primary_key: true,
						has_auto_increment: true,
					},
				},
			];

		// Ensure that every field meta has the field/collection fields filled correctly
		payload.fields = payload.fields.map((field) => {
			if (field.meta) {
				field.meta = {
					...field.meta,
					field: field.field,
					collection: payload.collection!,
				};
			}

			return field;
		});

		// Create the collection/fields in a transaction so it'll be reverted in case of errors or
		// permission problems. This might not work reliably in MySQL, as it doesn't support DDL in
		// transactions.
		await this.knex.transaction(async (trx) => {
			const fieldsService = new FieldsService({ knex: trx, schema: this.schema });

			// This operation is locked to admin users only, so we don't have to worry about the order
			// of operations here with regards to permissions checks

			const collectionItemsService = new ItemsService('directus_collections', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const fieldItemsService = new ItemsService('directus_fields', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			if (payload.collection.startsWith('directus_')) {
				throw new InvalidPayloadException(`Collections can't start with "directus_"`);
			}

			if (payload.collection in this.schema.collections) {
				throw new InvalidPayloadException(`Collection "${payload.collection}" already exists.`);
			}

			await trx.schema.createTable(payload.collection, (table) => {
				for (const field of payload.fields!) {
					if (field.type && ALIAS_TYPES.includes(field.type) === false) {
						fieldsService.addColumnToTable(table, field);
					}
				}
			});

			await collectionItemsService.createOne({
				...(payload.meta || {}),
				collection: payload.collection,
			});

			const fieldPayloads = payload.fields!.filter((field) => field.meta).map((field) => field.meta) as FieldMeta[];
			await fieldItemsService.createMany(fieldPayloads);

			return payload.collection;
		});

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return payload.collection;
	}

	/**
	 * Create multiple new collections
	 */
	async createMany(payloads: RawCollection[], opts?: MutationOptions): Promise<string[]> {
		const collections = await this.knex.transaction(async (trx) => {
			const service = new CollectionsService({
				schema: this.schema,
				accountability: this.accountability,
				knex: trx,
			});

			const collectionNames: string[] = [];

			for (const payload of payloads) {
				const name = await service.createOne(payload, { autoPurgeCache: false });
				collectionNames.push(name);
			}

			return collectionNames;
		});

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return collections;
	}

	/**
	 * Read all collections. Currently doesn't support any query.
	 */
	async readByQuery(): Promise<Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});

		let tablesInDatabase = await this.schemaInspector.tableInfo();

		if (this.accountability && this.accountability.admin !== true) {
			const collectionsYouHavePermissionToRead: string[] = this.schema.permissions
				.filter((permission) => {
					return permission.action === 'read';
				})
				.map(({ collection }) => collection);

			tablesInDatabase = tablesInDatabase.filter((table) => {
				return collectionsYouHavePermissionToRead.includes(table.name);
			});
		}

		const tablesToFetchInfoFor = tablesInDatabase.map((table) => table.name);

		const meta = (await collectionItemsService.readByQuery({
			filter: { collection: { _in: tablesToFetchInfoFor } },
			limit: -1,
		})) as CollectionMeta[];

		meta.push(...systemCollectionRows);

		const collections: Collection[] = [];

		/**
		 * The collections as known in the schema cache.
		 */
		const knownCollections = Object.keys(this.schema.collections);

		for (const table of tablesInDatabase) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo?.collection === table.name) || null,
				schema: table,
			};

			// By only returning collections that are known in the schema cache, we prevent weird
			// situations where the collections endpoint returns different info from every other
			// collection
			if (knownCollections.includes(table.name)) {
				collections.push(collection);
			}
		}

		return collections;
	}

	/**
	 * Get a single collection by name
	 */
	async readOne(collectionKey: string): Promise<Collection> {
		const result = await this.readMany([collectionKey]);
		return result[0];
	}

	/**
	 * Read many collections by name
	 */
	async readMany(collectionKeys: string[]): Promise<Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		if (this.accountability && this.accountability.admin !== true) {
			const permissions = this.schema.permissions.filter((permission) => {
				return permission.action === 'read' && collectionKeys.includes(permission.collection);
			});

			if (collectionKeys.length !== permissions.length) {
				const collectionsYouHavePermissionToRead = permissions.map(({ collection }) => collection);

				for (const collectionKey of collectionKeys) {
					if (collectionsYouHavePermissionToRead.includes(collectionKey) === false) {
						throw new ForbiddenException();
					}
				}
			}
		}

		const tablesInDatabase = await this.schemaInspector.tableInfo();
		const tables = tablesInDatabase.filter((table) => collectionKeys.includes(table.name));

		const meta = (await collectionItemsService.readByQuery({
			filter: { collection: { _in: collectionKeys } },
			limit: -1,
		})) as CollectionMeta[];

		meta.push(...systemCollectionRows);

		const collections: Collection[] = [];

		const knownCollections = Object.keys(this.schema.collections);

		for (const table of tables) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo?.collection === table.name) || null,
				schema: table,
			};

			// By only returning collections that are known in the schema cache, we prevent weird
			// situations where the collections endpoint returns different info from every other
			// collection
			if (knownCollections.includes(table.name)) {
				collections.push(collection);
			}
		}

		return collections;
	}

	/**
	 * Update a single collection by name
	 */
	async updateOne(collectionKey: string, data: Partial<Collection>, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const payload = data as Partial<Collection>;

		if (!payload.meta) {
			return collectionKey;
		}

		const exists = !!(await this.knex
			.select('collection')
			.from('directus_collections')
			.where({ collection: collectionKey })
			.first());

		if (exists) {
			await collectionItemsService.updateOne(collectionKey, payload.meta, opts);
		} else {
			await collectionItemsService.createOne({ ...payload.meta, collection: collectionKey }, opts);
		}

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return collectionKey;
	}

	/**
	 * Update multiple collections by name
	 */
	async updateMany(collectionKeys: string[], data: Partial<Collection>, opts?: MutationOptions): Promise<string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		await this.knex.transaction(async (trx) => {
			const service = new CollectionsService({
				schema: this.schema,
				accountability: this.accountability,
				knex: trx,
			});

			for (const collectionKey of collectionKeys) {
				await service.updateOne(collectionKey, data, { autoPurgeCache: false });
			}
		});

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return collectionKeys;
	}

	/**
	 * Delete a single collection This will delete the table and all records within. It'll also
	 * delete any fields, presets, activity, revisions, and permissions relating to this collection
	 */
	async deleteOne(collectionKey: string, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		const tablesInDatabase = Object.keys(this.schema.collections);

		if (tablesInDatabase.includes(collectionKey) === false) {
			throw new ForbiddenException();
		}

		await this.knex.transaction(async (trx) => {
			const collectionItemsService = new ItemsService('directus_collections', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const fieldsService = new FieldsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			await trx('directus_fields').delete().where('collection', '=', collectionKey);
			await trx('directus_presets').delete().where('collection', '=', collectionKey);

			const revisionsToDelete = await trx.select('id').from('directus_revisions').where({ collection: collectionKey });

			if (revisionsToDelete.length > 0) {
				const keys = revisionsToDelete.map((record) => record.id);
				await trx('directus_revisions').update({ parent: null }).whereIn('parent', keys);
			}

			await trx('directus_revisions').delete().where('collection', '=', collectionKey);

			await trx('directus_activity').delete().where('collection', '=', collectionKey);
			await trx('directus_permissions').delete().where('collection', '=', collectionKey);
			await trx('directus_relations').delete().where({ many_collection: collectionKey });

			const relations = this.schema.relations.filter((relation) => {
				return relation.collection === collectionKey || relation.related_collection === collectionKey;
			});

			for (const relation of relations) {
				// Delete related o2m fields that point to current collection
				if (relation.related_collection && relation.meta?.one_field) {
					await fieldsService.deleteField(relation.related_collection, relation.meta.one_field);
				}

				// Delete related m2o fields that point to current collection
				if (relation.related_collection === collectionKey) {
					await fieldsService.deleteField(relation.collection, relation.field);
				}
			}

			const m2aRelationsThatIncludeThisCollection = this.schema.relations.filter((relation) => {
				return relation.meta?.one_allowed_collections?.includes(collectionKey);
			});

			for (const relation of m2aRelationsThatIncludeThisCollection) {
				const newAllowedCollections = relation
					.meta!.one_allowed_collections!.filter((collection) => collectionKey !== collection)
					.join(',');
				await trx('directus_relations')
					.update({ one_allowed_collections: newAllowedCollections })
					.where({ id: relation.meta!.id });
			}

			await collectionItemsService.deleteOne(collectionKey);
			await trx.schema.dropTable(collectionKey);
		});

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return collectionKey;
	}

	/**
	 * Delete multiple collections by key
	 */
	async deleteMany(collectionKeys: string[], opts?: MutationOptions): Promise<string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		await this.knex.transaction(async (trx) => {
			const service = new CollectionsService({
				schema: this.schema,
				accountability: this.accountability,
				knex: trx,
			});

			for (const collectionKey of collectionKeys) {
				await service.deleteOne(collectionKey, { autoPurgeCache: false });
			}
		});

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return collectionKeys;
	}
}
