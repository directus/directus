import type { DirectusFile } from '../../../schema/file.js';
import type { AssetsQuery } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Read the contents of a file as a ReadableStream
 *
 * @param {string} key
 * @param {AssetsQuery} query
 * @returns {ReadableStream<Uint8Array>}
 */
export const readAssetRaw =
	<Schema>(key: DirectusFile<Schema>['id'], query?: AssetsQuery): RestCommand<ReadableStream<Uint8Array>, Schema> =>
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
 * Read the contents of a file as a Blob
 *
 * @param {string} key
 * @param {AssetsQuery} query
 * @returns {Blob}
 */
export const readAssetBlob =
	<Schema>(key: DirectusFile<Schema>['id'], query?: AssetsQuery): RestCommand<Blob, Schema> =>
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
 * Read the contents of a file as a ArrayBuffer
 *
 * @param {string} key
 * @param {AssetsQuery} query
 * @returns {ArrayBuffer}
 */
export const readAssetArrayBuffer =
	<Schema>(key: DirectusFile<Schema>['id'], query?: AssetsQuery): RestCommand<ArrayBuffer, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/assets/${key}`,
			params: query ?? {},
			method: 'GET',
			onResponse: (response) => response.arrayBuffer(),
		};
	};
