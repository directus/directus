import type { DirectusFile } from '../../../schema/file.js';
import type { Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * @returns ReadableStream<Uint8Array>
 */
export const readAssetRaw =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		key: DirectusFile<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadableStream<Uint8Array>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.body,
		};
	}

/**
 * @returns Blob
 */
export const readAssetBlob =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		key: DirectusFile<Schema>['id'],
		query?: TQuery
	): RestCommand<Blob, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.blob(),
		};
	}

/**
 * @returns ArrayBuffer
 */
export const readAssetArrayBuffer =
<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
	key: DirectusFile<Schema>['id'],
	query?: TQuery
): RestCommand<ArrayBuffer, Schema> =>
() => {
	throwIfEmpty(String(key), 'Key cannot be empty');

	return {
		path: `/assets/${key}`,
		params: query ?? {},
		method: 'GET',
		onResponse: (response) => response.arrayBuffer(),
	};
}
