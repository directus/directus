import database, { schemaInspector } from '../database';
import { AbstractServiceOptions, Accountability, Collection, CollectionMeta, Relation, SchemaOverview } from '../types';
import Knex from 'knex';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { FieldsService } from '../services/fields';
import { ItemsService } from '../services/items';
import cache from '../cache';
import { toArray } from '../utils/to-array';
import { systemCollectionRows } from '../database/system-data/collections';
import env from '../env';

export class CollectionsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	create(data: Partial<Collection>[]): Promise<string[]>;
	create(data: Partial<Collection>): Promise<string>;
	async create(data: Partial<Collection> | Partial<Collection>[]): Promise<string | string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		const payloads = toArray(data).map((collection) => {
			if (!collection.fields) collection.fields = [];

			collection.fields = collection.fields.map((field) => {
				if (field.meta) {
					field.meta = {
						...field.meta,
						field: field.field,
						collection: collection.collection!,
					};
				}

				return field;
			});

			return collection;
		});

		const createdCollections: string[] = [];

		await this.knex.transaction(async (trx) => {
			const fieldsService = new FieldsService({ knex: trx, schema: this.schema });

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

			for (const payload of payloads) {
				if (!payload.collection) {
					throw new InvalidPayloadException(`The "collection" key is required.`);
				}

				if (payload.collection.startsWith('directus_')) {
					throw new InvalidPayloadException(`Collections can't start with "directus_"`);
				}

				if (payload.collection in this.schema.tables) {
					throw new InvalidPayloadException(`Collection "${payload.collection}" already exists.`);
				}

				await trx.schema.createTable(payload.collection, (table) => {
					for (const field of payload.fields!) {
						fieldsService.addColumnToTable(table, field);
					}
				});

				await collectionItemsService.create({
					...(payload.meta || {}),
					collection: payload.collection,
				});

				const fieldPayloads = payload.fields!.filter((field) => field.meta).map((field) => field.meta);

				await fieldItemsService.create(fieldPayloads);

				createdCollections.push(payload.collection);
			}
		});

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return Array.isArray(data) ? createdCollections : createdCollections[0];
	}

	readByKey(collection: string[]): Promise<Collection[]>;
	readByKey(collection: string): Promise<Collection>;
	async readByKey(collection: string | string[]): Promise<Collection | Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const collectionKeys = toArray(collection);

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

		const tablesInDatabase = await schemaInspector.tableInfo();
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

		return Array.isArray(collection) ? collections : collections[0];
	}

	/** @todo, read by query without query support is a bit ironic, isn't it */
	async readByQuery(): Promise<Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			schema: this.schema,
		});

		let tablesInDatabase = await schemaInspector.tableInfo();

		if (this.accountability && this.accountability.admin !== true) {
			const collectionsYouHavePermissionToRead: string[] = this.schema.permissions
				.filter((permission) => {
					return permission.action === 'read';
				})
				.map(({ collection }) => collection);

			tablesInDatabase = tablesInDatabase.filter((table) => {
				return collectionsYouHavePermissionToRead.includes(table.name);
			});

			if (tablesInDatabase.length === 0) {
				throw new ForbiddenException();
			}
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
	 * @NOTE
	 * We only suppport updating the content in directus_collections
	 */
	update(data: Partial<Collection>, keys: string[]): Promise<string[]>;
	update(data: Partial<Collection>, key: string): Promise<string>;
	update(data: Partial<Collection>[]): Promise<string[]>;
	async update(data: Partial<Collection> | Partial<Collection>[], key?: string | string[]): Promise<string | string[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		if (data && key) {
			const payload = data as Partial<Collection>;

			if (!payload.meta) {
				throw new InvalidPayloadException(`"meta" key is required`);
			}

			const keys = toArray(key);

			for (const key of keys) {
				const exists =
					(await this.knex.select('collection').from('directus_collections').where({ collection: key }).first()) !==
					undefined;

				if (exists) {
					await collectionItemsService.update(payload.meta, key);
				} else {
					await collectionItemsService.create({ ...payload.meta, collection: key });
				}
			}

			return key;
		}

		const payloads = toArray(data);

		const collectionUpdates = payloads.map((collection) => {
			return {
				...collection.meta,
				collection: collection.collection,
			};
		});

		await collectionItemsService.update(collectionUpdates);

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return key!;
	}

	delete(collections: string[]): Promise<string[]>;
	delete(collection: string): Promise<string>;
	async delete(collection: string[] | string): Promise<string[] | string> {
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

		const tablesInDatabase = Object.keys(this.schema.tables);

		const collectionKeys = toArray(collection);

		for (const collectionKey of collectionKeys) {
			if (tablesInDatabase.includes(collectionKey) === false) {
				throw new InvalidPayloadException(`Collection "${collectionKey}" doesn't exist.`);
			}
		}

		await collectionItemsService.delete(collectionKeys);

		await this.knex('directus_fields').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_presets').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_revisions').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_activity').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_permissions').delete().whereIn('collection', collectionKeys);

		const relations = this.schema.relations.filter((relation) => {
			return relation.many_collection === collection || relation.one_collection === collection;
		});

		for (const relation of relations) {
			const isM2O = relation.many_collection === collection;

			if (isM2O) {
				await this.knex('directus_relations')
					.delete()
					.where({ many_collection: collection, many_field: relation.many_field });

				await fieldsService.deleteField(relation.one_collection!, relation.one_field!);
			} else if (!!relation.one_collection) {
				await this.knex('directus_relations')
					.update({ one_field: null })
					.where({ one_collection: collection, one_field: relation.one_field });
				await fieldsService.deleteField(relation.many_collection, relation.many_field);
			}
		}

		for (const collectionKey of collectionKeys) {
			await this.knex.schema.dropTable(collectionKey);
		}

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return collection;
	}
}
