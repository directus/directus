import database, { schemaInspector } from '../database';
import ItemsService from '../services/items';
import { Query } from '../types/query';
import { ColumnBuilder } from 'knex';
import { Accountability } from '../types/accountability';

/**
 * @TODO turn this into a class
 */

/** @Todo properly type this */
export const create = async (payload: any, accountability?: Accountability) => {
	const itemsService = new ItemsService('directus_collections', { accountability });

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

	const primaryKey = await itemsService.create({
		collection: payload.collection,
		hidden: payload.hidden || false,
		singleton: payload.singleton || false,
		icon: payload.icon || null,
		note: payload.note || null,
		translation: payload.translation || null,
	});

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

	return await itemsService.readByKey(primaryKey);
};

export const readAll = async (query: Query, accountability?: Accountability) => {
	const itemsService = new ItemsService('directus_collections', { accountability });

	const [tables, collections] = await Promise.all([
		schemaInspector.tableInfo(),
		itemsService.readByQuery(query),
	]);

	const data = tables.map((table) => {
		const collectionInfo = collections.find((collection) => {
			return collection.collection === table.name;
		});

		return {
			collection: table.name,
			note: table.comment,
			hidden: collectionInfo?.hidden || false,
			singleton: collectionInfo?.singleton || false,
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
	const itemsService = new ItemsService('directus_collections', { accountability });

	const [table, collectionInfo] = await Promise.all([
		schemaInspector.tableInfo(collection),
		itemsService.readByQuery(query),
	]);

	return {
		collection: table.name,
		note: table.comment,
		hidden: collectionInfo[0]?.hidden || false,
		singleton: collectionInfo[0]?.singleton || false,
		icon: collectionInfo[0]?.icon || null,
		translation: collectionInfo[0]?.translation || null,
	};
};

export const deleteCollection = async (collection: string, accountability?: Accountability) => {
	const itemsService = new ItemsService('directus_collections', { accountability });

	await Promise.all([
		database.schema.dropTable(collection),
		itemsService.delete(collection),
		database.delete().from('directus_fields').where({ collection }),
		database
			.delete()
			.from('directus_relations')
			.where({ many_collection: collection })
			.orWhere({ one_collection: collection }),
	]);
};
