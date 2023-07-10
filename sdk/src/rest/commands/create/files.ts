import type { DirectusFile } from '../../../schema/file.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
// import type { RestCommand } from '../../types.js';
// import { queryToParams } from '../../utils/query-to-params.js';

export type CreateFileOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusFile<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

//TODO import and upload files

// export const createFiles =
// 	<Schema extends object, TQuery extends Query<Schema, DirectusFile<Schema>>>(
// 		items: Partial<DirectusFile<Schema>>[],
// 		query?: TQuery
// 	): RestCommand<CreateFileOutput<Schema, TQuery>[], Schema> =>
// 	() => ({
// 		path: `/`,
// 		params: queryToParams(query ?? {}),
// 		body: JSON.stringify(items),
// 		method: 'POST',
// 	});


// export const createFile =
// 	<Schema extends object, TQuery extends Query<Schema, DirectusFile<Schema>>>(
// 		item: Partial<DirectusFile<Schema>>,
// 		query?: TQuery
// 	): RestCommand<CreateFileOutput<Schema, TQuery>, Schema> =>
// 	() => ({
// 		path: `/`,
// 		params: queryToParams(query ?? {}),
// 		body: JSON.stringify(item),
// 		method: 'POST',
// 	});
