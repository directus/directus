import { Knex } from 'knex';
import getDatabase from '../database';
import { AbstractServiceOptions, File } from '../types';
import { Accountability, Query, SchemaOverview } from '@directus/shared/types';
import {
	ForbiddenException,
	InvalidPayloadException,
	ServiceUnavailableException,
	UnsupportedMediaTypeException,
} from '../exceptions';
import StreamArray from 'stream-json/streamers/StreamArray';
import { ItemsService } from './items';
import { queue } from 'async';
import destroyStream from 'destroy';
import csv from 'csv-parser';
import { set, transform } from 'lodash';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import { appendFile, createReadStream } from 'fs-extra';
import { file as createTmpFile } from 'tmp-promise';
import env from '../env';
import { FilesService } from './files';
import { getDateFormatted } from '../utils/get-date-formatted';
import { toArray } from '@directus/shared/utils';

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(collection: string, mimetype: string, stream: NodeJS.ReadableStream): Promise<void> {
		if (collection.startsWith('directus_')) throw new ForbiddenException();

		const createPermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'create'
		);

		const updatePermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'update'
		);

		if (this.accountability?.admin !== true && (!createPermissions || !updatePermissions)) {
			throw new ForbiddenException();
		}

		switch (mimetype) {
			case 'application/json':
				return await this.importJSON(collection, stream);
			case 'text/csv':
			case 'application/vnd.ms-excel':
				return await this.importCSV(collection, stream);
			default:
				throw new UnsupportedMediaTypeException(`Can't import files of type "${mimetype}"`);
		}
	}

	importJSON(collection: string, stream: NodeJS.ReadableStream): Promise<void> {
		const extractJSON = StreamArray.withParser();

		return this.knex.transaction((trx) => {
			const service = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value);
			});

			return new Promise<void>((resolve, reject) => {
				stream.pipe(extractJSON);

				extractJSON.on('data', ({ value }) => {
					saveQueue.push(value);
				});

				extractJSON.on('error', (err) => {
					destroyStream(stream);
					destroyStream(extractJSON);

					reject(new InvalidPayloadException(err.message));
				});

				saveQueue.error((err) => {
					reject(err);
				});

				extractJSON.on('end', () => {
					saveQueue.drain(() => {
						return resolve();
					});
				});
			});
		});
	}

	importCSV(collection: string, stream: NodeJS.ReadableStream): Promise<void> {
		return this.knex.transaction((trx) => {
			const service = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value);
			});

			return new Promise<void>((resolve, reject) => {
				stream
					.pipe(csv())
					.on('data', (value: Record<string, string>) => {
						const obj = transform(value, (result: Record<string, string>, value, key) => {
							if (value.length === 0) {
								delete result[key];
							} else {
								try {
									const parsedJson = JSON.parse(value);
									set(result, key, parsedJson);
								} catch {
									set(result, key, value);
								}
							}
						});

						saveQueue.push(obj);
					})
					.on('error', (err) => {
						destroyStream(stream);
						reject(new InvalidPayloadException(err.message));
					})
					.on('end', () => {
						saveQueue.drain(() => {
							return resolve();
						});
					});

				saveQueue.error((err) => {
					reject(err);
				});
			});
		});
	}
}

export class ExportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * Export the query results as a named file. Will query in batches, and keep appending a tmp file
	 * until all the data is retrieved. Uploads the result as a new file using the regular
	 * FilesService upload method.
	 */
	async exportToFile(
		collection: string,
		query: Partial<Query>,
		type: 'xml' | 'csv' | 'json',
		options?: {
			file?: Partial<File>;
		}
	) {
		const mimeTypes = {
			xml: 'text/xml',
			csv: 'text/csv',
			json: 'application/json',
		};

		const database = getDatabase();

		const { path, cleanup } = await createTmpFile();

		await database.transaction(async (trx) => {
			const service = new ItemsService(collection, {
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			let hasMore = true;
			let page = 0;
			let readCount = 0;
			const requestedLimit = query.limit ?? -1;

			while (hasMore) {
				let limit = env.EXPORT_BATCH_SIZE;

				if (requestedLimit > 0 && env.EXPORT_BATCH_SIZE > requestedLimit - readCount) {
					limit = requestedLimit - readCount;
				}

				const result = await service.readByQuery({
					...query,
					limit,
					page,
				});

				readCount += result.length;

				if (result.length) {
					await appendFile(path, this.transform(result, type));
				}

				page++;
				hasMore = result.length >= env.EXPORT_BATCH_SIZE;
				if (requestedLimit > 0 && readCount >= requestedLimit) hasMore = false;
			}
		});

		const filesService = new FilesService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const storage: string = toArray(env.STORAGE_LOCATIONS)[0];

		const title = `Export of ${collection} at ${getDateFormatted()}`;
		const filename = `${title}.${type}`;

		const fileWithDefaults: Partial<File> & { storage: string; filename_download: string } = {
			...(options?.file ?? {}),
			title: options?.file?.title ?? title,
			filename_download: options?.file?.filename_download ?? filename,
			storage: options?.file?.storage ?? storage,
			type: mimeTypes[type],
		};

		await filesService.uploadOne(createReadStream(path), fileWithDefaults);

		await cleanup();
	}

	/**
	 * Transform a given input object / array to the given type
	 */
	transform(input: Record<string, any> | Record<string, any>[], type: 'xml' | 'csv' | 'json'): string {
		if (type === 'json') {
			return JSON.stringify(input || null, null, '\t');
		}

		if (type === 'xml') {
			return toXML('data', input);
		}

		if (type === 'csv') {
			const parser = new CSVParser({ transforms: [CSVTransforms.flatten({ separator: '.' })] });
			return parser.parse(input);
		}

		throw new ServiceUnavailableException(`Illegal export type used: "${type}"`, { service: 'export' });
	}
}
