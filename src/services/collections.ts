import { schemaInspector } from '../database';
import * as ItemsService from '../services/items';
import { Table } from '../../../../knex-schema-inspector/lib/types/table';
import { Collection } from '../types/collection';
import { Query } from '../types/query';

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
