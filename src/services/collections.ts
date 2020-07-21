import database, { schemaInspector } from '../database';
import * as ItemsService from '../services/items';
import { Collection } from '../types/collection';
import { Query } from '../types/query';
import { ColumnBuilder } from 'knex';
import { Accountability } from '../types/accountability';

/** @Todo properly type this */
export const create = async (payload: any, accountability: Accountability) => {
	await database.schema.createTable(payload.collection, (table) => {
		if (payload.note) {
			table.comment(payload.note);
		}

		/** @todo move this into fields service */

		/** @todo adhere to new nested structure system vs database */

		payload.fields?.forEach((field: any) => {
			let column: ColumnBuilder;

			if (field.auto_increment) {
				column = table.increments(field.field);
			} else {
				const datatype = field.length
					? `${field.datatype}(${field.length})`
					: field.datatype;
				column = table.specificType(field.field, datatype);

				// increments() also sets primary key
				if (field.primary_key) {
					column.primary();
				}
			}

			if (field.note) {
				column.comment(field.note);
			}
		});
	});

	const primaryKey = await ItemsService.createItem(
		'directus_collections',
		{
			collection: payload.collection,
			hidden: payload.hidden || false,
			single: payload.single || false,
			icon: payload.icon || null,
			note: payload.note || null,
			translation: payload.translation || null,
		},
		accountability
	);

	/**
	 * @TODO make this flexible and based on payload
	 */
	await database('directus_fields').insert(
		payload.fields.map((field: any) => ({
			collection: payload.collection,
			field: field.field,
			locked: false,
			required: false,
			readonly: false,
			hidden_detail: false,
			hidden_browse: false,
		}))
	);

	return await ItemsService.readItem('directus_collections', primaryKey, {});
};

export const readAll = async (query: Query, accountability?: Accountability) => {
	const [tables, collections] = await Promise.all([
		schemaInspector.tableInfo(),
		ItemsService.readItems<Collection>('directus_collections', query, accountability),
	]);

	const data = tables.map((table) => {
		const collectionInfo = collections.find((collection) => {
			return collection.collection === table.name;
		});

		return {
			collection: table.name,
			note: table.comment,
			hidden: collectionInfo?.hidden || false,
			single: collectionInfo?.single || false,
			icon: collectionInfo?.icon || null,
			translation: collectionInfo?.translation || null,
		};
	});

	return data;
};

export const readOne = async (
	collection: string,
	query: Query,
	accountability?: Accountability
) => {
	const [table, collectionInfo] = await Promise.all([
		schemaInspector.tableInfo(collection),
		ItemsService.readItem('directus_collections', collection, query, accountability),
	]);

	return {
		collection: table.name,
		note: table.comment,
		hidden: collectionInfo?.hidden || false,
		single: collectionInfo?.single || false,
		icon: collectionInfo?.icon || null,
		translation: collectionInfo?.translation || null,
	};
};

export const deleteCollection = async (collection: string, accountability: Accountability) => {
	await Promise.all([
		database.schema.dropTable(collection),
		ItemsService.deleteItem('directus_collections', collection, accountability),
		database.delete().from('directus_fields').where({ collection }),
		database
			.delete()
			.from('directus_relations')
			.where({ collection_many: collection })
			.orWhere({ collection_one: collection }),
	]);
};
