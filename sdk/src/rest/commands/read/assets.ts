import type { DirectusFile } from '../../../schema/file.js';
import type { AssetsQuery } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * @returns ReadableStream<Uint8Array>
 */
export const readAssetRaw =
	<Schema extends object>(
		key: DirectusFile<Schema>['id'],
		query?: AssetsQuery
	): RestCommand<ReadableStream<Uint8Array>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.body,
		};
	};

/**
 * @returns Blob
 */
export const readAssetBlob =
	<Schema extends object>(key: DirectusFile<Schema>['id'], query?: AssetsQuery): RestCommand<Blob, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.blob(),
		};
	};

/**
 * @returns ArrayBuffer
 */
export const readAssetArrayBuffer =
	<Schema extends object>(key: DirectusFile<Schema>['id'], query?: AssetsQuery): RestCommand<ArrayBuffer, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.arrayBuffer(),
		};
	};
