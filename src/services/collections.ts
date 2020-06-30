import database, { schemaInspector } from '../database';
import * as ItemsService from '../services/items';
import { Table } from '../knex-schema-inspector/lib/types/table';
import { Collection } from '../types/collection';
import { Query } from '../types/query';
import { ColumnBuilder } from 'knex';

/** @Todo properly type this */
export const create = async (payload: any) => {
	await database.schema.createTable(payload.collection, (table) => {
		if (payload.note) {
			table.comment(payload.note);
		}

		payload.fields?.forEach((field: any) => {
			let column: ColumnBuilder;

			if (field.auto_increment) {
				column = table.increments(field.field);
			} else {
				column = table.specificType(field.field, field.datatype);

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

	return await ItemsService.createItem('directus_collections', {
		collection: payload.collection,
		hidden: payload.hidden || false,
		single: payload.single || false,
		icon: payload.icon || null,
		note: payload.note || null,
		translation: payload.translation || null,
	});
};

export const readAll = async (query?: Query) => {
	const [tables, collections] = await Promise.all([
		schemaInspector.tables(),
		ItemsService.readItems<Collection>('directus_collections', query),
	]);

	const data = (tables as Table[]).map((table) => {
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

export const readOne = async (collection: string, query?: Query) => {
	const [table, collectionInfo] = await Promise.all([
		schemaInspector.table(collection),
		ItemsService.readItem<Collection>('directus_collections', collection, query),
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
