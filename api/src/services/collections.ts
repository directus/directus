import database, { schemaInspector } from '../database';
import { Query } from '../types/query';
import { AbstractServiceOptions, Accountability, Collection } from '../types';
import Knex from 'knex';
import ItemsService from '../services/items';
import FieldsService from '../services/fields';
import { omit } from 'lodash';

export default class CollectionsService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	itemsService: ItemsService;
	fieldsService: FieldsService;

	constructor(options?: AbstractServiceOptions) {
		super('directus_collections', options);

		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
		this.itemsService = new ItemsService('directus_collections', options);
		this.fieldsService = new FieldsService(options);
	}

	create(data: Partial<Collection>[]): Promise<string[]>;
	create(data: Partial<Collection>): Promise<string>;
	async create(data: Partial<Collection> | Partial<Collection>[]): Promise<string | string[]> {
		const payloads = Array.isArray(data) ? data : [data];

		// We'll create the fields separately. We don't want them to be inserted relationally
		const payloadsWithoutFields = payloads.map((payload) => omit(payload, 'fields'));

		await this.itemsService.create(payloadsWithoutFields);

		for (const payload of payloads) {
			// @TODO add basic validation to ensure all used fields are provided before attempting to save
			await this.knex.schema.createTable(payload.collection!, async (table) => {
				for (const field of payload.fields!) {
					await this.fieldsService.createField(payload.collection!, field, table);
				}
			});
		}

		const collectionNames = payloads.map((payload) => payload.collection!);
		return Array.isArray(data) ? collectionNames : collectionNames[0];
	}

	/**
	 * @todo
	 * update w/ nested fields
	 */

	delete(collection: string): Promise<string>;
	delete(collections: string[]): Promise<string[]>;
	async delete(collection: string | string[]): Promise<string | string[]> {
		const collections = Array.isArray(collection) ? collection : [collection];

		/**
		 * @todo check permissions manually
		 * this.itemsService.delete does the permissions check, but we have to delete the records from fields/relations first
		 * to adhere to the foreign key constraints
		 */

		await this.knex('directus_fields').delete().whereIn('collection', collections);
		await this.knex('directus_relations')
			.delete()
			.whereIn('many_collection', collections)
			.orWhereIn('one_collection', collections);

		await this.itemsService.delete(collection as any);

		for (const collectionName of collections) {
			await this.knex.schema.dropTable(collectionName);
		}

		return collection;
	}
}
