import type { DirectusFile } from '../../../schema/file.js';
import type { AssetResponse, AssetsQuery, DownloadZipOptions, ResponseTransformer } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

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

/**
 * Download a ZIP archive containing the specified files.
 *
 * @param keys An array of file IDs to include in the ZIP archive, must contain at least one ID.
 * @param options
 */
export const downloadFilesZip =
	<Schema, R extends keyof AssetResponse>(
		keys: DirectusFile<Schema>['id'][],
		options: DownloadZipOptions<R>,
	): RestCommand<AssetResponse[R], Schema> =>
	() => {
		throwIfEmpty(String(keys), 'Keys cannot be empty');

		let onResponseHandler: ResponseTransformer = (response) => response.body;

		if (options?.type === 'arrayBuffer') {
			onResponseHandler = (response) => response.arrayBuffer();
		} else if (options?.type === 'blob') {
			onResponseHandler = (response) => response.blob();
		}

		return {
			path: `/assets/files/`,
			body: JSON.stringify({
				ids: keys,
			}),
			method: 'POST',
			onResponse: onResponseHandler,
		};
	};

/**
 * Download a ZIP archive of an entire folder tree.
 *
 * @param key The root folder ID to download.
 * @param options
 */
export const downloadFolderZip =
	<Schema, R extends keyof AssetResponse>(
		key: DirectusFile<Schema>['id'],
		options?: DownloadZipOptions<R>,
	): RestCommand<AssetResponse[R], Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		let onResponseHandler: ResponseTransformer = (response) => response.body;

		if (options?.type === 'arrayBuffer') {
			onResponseHandler = (response) => response.arrayBuffer();
		} else if (options?.type === 'blob') {
			onResponseHandler = (response) => response.blob();
		}

		return {
			path: `/assets/folder/${key}`,
			method: 'POST',
			onResponse: onResponseHandler,
		};
	};
