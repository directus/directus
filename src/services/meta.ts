import { Query } from '../types/query';
import database from '../database';

export const getMetaForQuery = async (collection: string, query: Query) => {
	if (!query || !query.meta) return;

	const results = await Promise.all(
		query.meta.map((metaVal) => {
			if (metaVal === 'total_count') return totalCount(collection);
			if (metaVal === 'filter_count') return filterCount(collection, query);
		})
	);

	return results.reduce((metaObject: Record<string, any>, value, index) => {
		return {
			...metaObject,
			[query.meta![index]]: value,
		};
	}, {});
};

export const totalCount = async (collection: string) => {
	const records = await database(collection).count('*');
	return records[0].count;
};

export const filterCount = async (collection: string, query: Query) => {
	/** @TODO use actual query builder logic from items service to get count */
	const records = await database(collection).count('*');
	return records[0].count;
};
