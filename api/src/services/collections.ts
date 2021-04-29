import { ALIAS_TYPES } from '../constants';
import database, { schemaInspector } from '../database';
import {
	AbstractServiceOptions,
	Accountability,
	Collection,
	CollectionMeta,
	FieldMeta,
	SchemaOverview,
} from '../types';
import { Knex } from 'knex';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { FieldsService } from '../services/fields';
import { ItemsService, MutationOptions } from '../services/items';
import cache from '../cache';
import { systemCollectionRows } from '../database/system-data/collections';
import SchemaInspector from '@directus/schema';
import env from '../env';
import logger from '../logger';

export class CollectionsService {
	knex: Knex;
	accountability: Accountability | null;
	schemaInspector: typeof schemaInspector;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schemaInspector = options.knex ? SchemaInspector(options.knex) : schemaInspector;
		this.schema = options.schema;
	}

	/**
	 * Create a single new collection
	 */
	async createOne(payload: Partial<Collection> & { collection: string }, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		if (!payload.collection) throw new InvalidPayloadException(`"collection" is required`);

		if (!payload.fields) payload.fields = [];

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

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return payload.collection;
	}

	/**
	 * Create multiple new collections
	 */
	async createMany(
		payloads: Partial<Collection> & { collection: string }[],
		opts?: MutationOptions
	): Promise<string[]> {
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

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
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

		for (const table of tablesInDatabase) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo?.collection === table.name) || null,
				schema: table,
			};

			collections.push(collection);
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
						throw new ForbiddenException(`You don't have access to the "${collectionKey}" collection.`);
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

		for (const table of tables) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo?.collection === table.name) || null,
				schema: table,
			};

			collections.push(collection);
		}

		return collections;
	}

	/**
	 * Update a single collection by name
	 *
	 * Note: only supports updating `meta`
	 */
	async updateOne(collectionKey: string, data: Partial<Collection>, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const payload = data as Partial<Collection>;

		if (!payload.meta) {
			throw new InvalidPayloadException(`"meta" key is required`);
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

		return collectionKey;
	}

	/**
	 * Update multiple collections by name
	 */
	async updateMany(collectionKeys: string[], data: Partial<Collection>): Promise<string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
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

		return collectionKeys;
	}

	/**
	 * Delete a single collection This will delete the table and all records within. It'll also
	 * delete any fields, presets, activity, revisions, and permissions relating to this collection
	 */
	async deleteOne(collectionKey: string, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const fieldsService = new FieldsService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const tablesInDatabase = Object.keys(this.schema.collections);

		if (tablesInDatabase.includes(collectionKey) === false) {
			throw new ForbiddenException();
		}

		await collectionItemsService.deleteOne(collectionKey);

		await this.knex('directus_fields').delete().where('collection', '=', collectionKey);
		await this.knex('directus_presets').delete().where('collection', '=', collectionKey);
		await this.knex('directus_revisions').delete().where('collection', '=', collectionKey);
		await this.knex('directus_activity').delete().where('collection', '=', collectionKey);
		await this.knex('directus_permissions').delete().where('collection', '=', collectionKey);

		const relations = this.schema.relations.filter((relation) => {
			return relation.many_collection === collectionKey || relation.one_collection === collectionKey;
		});

		for (const relation of relations) {
			const isM2O = relation.many_collection === collectionKey;

			if (isM2O) {
				await this.knex('directus_relations')
					.delete()
					.where({ many_collection: collectionKey, many_field: relation.many_field });

				await fieldsService.deleteField(relation.one_collection!, relation.one_field!);
			} else if (!!relation.one_collection) {
				await this.knex('directus_relations')
					.update({ one_field: null })
					.where({ one_collection: collectionKey, one_field: relation.one_field });
				await fieldsService.deleteField(relation.many_collection, relation.many_field);
			}
		}

		await this.knex.schema.dropTable(collectionKey);

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return collectionKey;
	}

	/**
	 * Delete multiple collections by key
	 */
	async deleteMany(collectionKeys: string[], opts?: MutationOptions): Promise<string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
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

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return collectionKeys;
	}

	/**
	 * @deprecated Use `createOne` or `createMany` instead
	 */
	create(data: (Partial<Collection> & { collection: string })[]): Promise<string[]>;
	create(data: Partial<Collection> & { collection: string }): Promise<string>;
	async create(
		data: (Partial<Collection> & { collection: string }) | (Partial<Collection> & { collection: string })[]
	): Promise<string | string[]> {
		logger.warn(
			'CollectionsService.create is deprecated and will be removed before v9.0.0. Use createOne or createMany instead.'
		);

		if (Array.isArray(data)) {
			return await this.createMany(data);
		} else {
			return await this.createOne(data);
		}
	}

	/**
	 * @deprecated Use `readOne` or `readMany` instead
	 */
	readByKey(collection: string[]): Promise<Collection[]>;
	readByKey(collection: string): Promise<Collection>;
	async readByKey(collection: string | string[]): Promise<Collection | Collection[]> {
		logger.warn(
			'CollectionsService.readByKey is deprecated and will be removed before v9.0.0. Use readOne or readMany instead.'
		);

		if (Array.isArray(collection)) return await this.readMany(collection);
		return await this.readOne(collection);
	}

	/**
	 * @deprecated Use `updateOne` or `updateMany` instead
	 */
	update(data: Partial<Collection>, keys: string[]): Promise<string[]>;
	update(data: Partial<Collection>, key: string): Promise<string>;
	async update(data: Partial<Collection>, key: string | string[]): Promise<string | string[]> {
		if (Array.isArray(key)) return await this.updateMany(key, data);
		return await this.updateOne(key, data);
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(collections: string[]): Promise<string[]>;
	delete(collection: string): Promise<string>;
	async delete(collection: string[] | string): Promise<string[] | string> {
		logger.warn(
			'CollectionsService.delete is deprecated and will be removed before v9.0.0. Use deleteOne or deleteMany instead.'
		);

		if (Array.isArray(collection)) return await this.deleteMany(collection);
		return await this.deleteOne(collection);
	}
}
