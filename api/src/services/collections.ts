import database, { schemaInspector } from '../database';
import { AbstractServiceOptions, Accountability, Collection } from '../types';
import Knex from 'knex';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import SchemaInspector from 'knex-schema-inspector';
import FieldsService from '../services/fields';
import { omit } from 'lodash';
import ItemsService from '../services/items';

export default class CollectionsService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	create(data: Partial<Collection>[]): Promise<string[]>;
	create(data: Partial<Collection>): Promise<string>;
	async create(data: Partial<Collection> | Partial<Collection>[]): Promise<string | string[]> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		const payloads = (Array.isArray(data) ? data : [data]).map((collection) => {
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
			const schemaInspector = SchemaInspector(trx);
			const fieldsService = new FieldsService({ knex: trx });
			const collectionItemsService = new ItemsService('directus_collections', {
				knex: trx,
				accountability: this.accountability,
			});
			const fieldItemsService = new ItemsService('directus_fields', {
				knex: trx,
				accountability: this.accountability,
			});

			for (const payload of payloads) {
				if (!payload.collection) {
					throw new InvalidPayloadException(`The "collection" key is required.`);
				}

				if (await schemaInspector.hasTable(payload.collection)) {
					throw new InvalidPayloadException(
						`Collection "${payload.collection}" already exists.`
					);
				}

				await trx.schema.createTable(payload.collection, (table) => {
					for (const field of payload.fields!) {
						fieldsService.addColumnToTable(table, field);
					}
				});

				const collectionInfo = omit(payload, 'fields');
				await collectionItemsService.create(collectionInfo);

				const fieldPayloads = payload
					.fields!.filter((field) => field.meta)
					.map((field) => field.meta);

				await fieldItemsService.create(fieldPayloads);

				createdCollections.push(payload.collection);
			}
		});

		return Array.isArray(data) ? createdCollections : createdCollections[0];
	}

	readByKey(collection: string[]): Promise<Collection[]>;
	readByKey(collection: string): Promise<Collection>;
	async readByKey(collection: string | string[]): Promise<Collection | Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
		});
		const collectionKeys = Array.isArray(collection) ? collection : [collection];

		if (this.accountability && this.accountability.admin !== true) {
			const permissions = await this.knex
				.select('collection')
				.from('directus_permissions')
				.where({ operation: 'read' })
				.where({ role: this.accountability.role })
				.whereIn('collection', collectionKeys);

			if (collectionKeys.length !== permissions.length) {
				const collectionsYouHavePermissionToRead = permissions.map(
					({ collection }) => collection
				);

				for (const collectionKey of collectionKeys) {
					if (collectionsYouHavePermissionToRead.includes(collectionKey) === false) {
						throw new ForbiddenException(
							`You don't have access to the "${collectionKey}" collection.`
						);
					}
				}
			}
		}

		const tablesInDatabase = await schemaInspector.tableInfo();
		const tables = tablesInDatabase.filter((table) => collectionKeys.includes(table.name));
		const meta: any[] = await collectionItemsService.readByQuery({
			filter: { collection: { _in: collectionKeys } },
		});

		const collections: Collection[] = [];

		for (const table of tables) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo.collection === table.name) || null,
				schema: table,
			};

			collections.push(collection);
		}

		return Array.isArray(collection) ? collections : collections[0];
	}

	/** @todo, read by query without query support is a bit ironic, isnt it */
	async readByQuery(): Promise<Collection[]> {
		const collectionItemsService = new ItemsService('directus_collections');
		let tablesInDatabase = await schemaInspector.tableInfo();

		if (this.accountability && this.accountability.admin !== true) {
			const collectionsYouHavePermissionToRead: string[] = (
				await this.knex.select('collection').from('directus_permissions').where({
					role: this.accountability.role,
					operation: 'read',
				})
			).map(({ collection }) => collection);

			tablesInDatabase = tablesInDatabase.filter((table) => {
				return collectionsYouHavePermissionToRead.includes(table.name);
			});
		}

		const tablesToFetchInfoFor = tablesInDatabase.map((table) => table.name);
		const meta: any[] = await collectionItemsService.readByQuery({
			filter: { collection: { _in: tablesToFetchInfoFor } },
		});

		const collections: Collection[] = [];

		for (const table of tablesInDatabase) {
			const collection: Collection = {
				collection: table.name,
				meta: meta.find((systemInfo) => systemInfo.collection === table.name) || null,
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
	async update(
		data: Partial<Collection> | Partial<Collection>[],
		key?: string | string[]
	): Promise<string | string[]> {
		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
		});

		if (data && key) {
			const payload = data as Partial<Collection>;

			if (!payload.meta) {
				throw new InvalidPayloadException(`"system" key is required`);
			}

			return (await collectionItemsService.update(payload.meta!, key as any)) as
				| string
				| string[];
		}

		const payloads = Array.isArray(data) ? data : [data];

		const collectionUpdates = payloads.map((collection) => {
			return {
				...collection.meta,
				collection: collection.collection,
			};
		});

		await collectionItemsService.update(collectionUpdates);

		return key!;
	}

	delete(collections: string[]): Promise<string[]>;
	delete(collection: string): Promise<string>;
	async delete(collection: string[] | string): Promise<string[] | string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		const tablesInDatabase = await schemaInspector.tables();

		const collectionKeys = Array.isArray(collection) ? collection : [collection];

		for (const collectionKey of collectionKeys) {
			if (tablesInDatabase.includes(collectionKey) === false) {
				throw new InvalidPayloadException(`Collection "${collectionKey}" doesn't exist.`);
			}
		}

		await this.knex('directus_fields').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_presets').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_revisions').delete().whereIn('collection', collectionKeys);
		await this.knex('directus_activity').delete().whereIn('collection', collectionKeys);

		await this.knex('directus_relations')
			.delete()
			.whereIn('many_collection', collectionKeys)
			.orWhereIn('one_collection', collectionKeys);

		const collectionItemsService = new ItemsService('directus_collections', {
			knex: this.knex,
			accountability: this.accountability,
		});
		await collectionItemsService.delete(collectionKeys);

		for (const collectionKey of collectionKeys) {
			await this.knex.schema.dropTable(collectionKey);
		}

		return collection;
	}
}
