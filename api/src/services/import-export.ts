import { Accountability, Query, SchemaOverview } from '@directus/shared/types';
import { parseJSON, toArray } from '@directus/shared/utils';
import { queue } from 'async';
import csv from 'csv-parser';
import destroyStream from 'destroy';
import { appendFile, createReadStream } from 'fs-extra';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import { Knex } from 'knex';
import { set, transform } from 'lodash';
import StreamArray from 'stream-json/streamers/StreamArray';
import stripBomStream from 'strip-bom-stream';
import { file as createTmpFile } from 'tmp-promise';
import getDatabase from '../database';
import env from '../env';
import {
	ForbiddenException,
	InvalidPayloadException,
	ServiceUnavailableException,
	UnsupportedMediaTypeException,
} from '../exceptions';
import logger from '../logger';
import { AbstractServiceOptions, File } from '../types';
import { getDateFormatted } from '../utils/get-date-formatted';
import { FilesService } from './files';
import { ItemsService } from './items';
import { NotificationsService } from './notifications';
import type { Readable } from 'node:stream';

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(collection: string, mimetype: string, stream: Readable): Promise<void> {
		if (this.accountability?.admin !== true && collection.startsWith('directus_')) throw new ForbiddenException();

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

	importJSON(collection: string, stream: Readable): Promise<void> {
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

				extractJSON.on('data', ({ value }: Record<string, any>) => {
					saveQueue.push(value);
				});

				extractJSON.on('error', (err: any) => {
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

	importCSV(collection: string, stream: Readable): Promise<void> {
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
					.pipe(stripBomStream())
					.pipe(csv())
					.on('data', (value: Record<string, string>) => {
						const obj = transform(value, (result: Record<string, string>, value, key) => {
							if (value.length === 0) {
								delete result[key];
							} else {
								try {
									const parsedJson = parseJSON(value);
									if (typeof parsedJson === 'number') {
										set(result, key, value);
									} else {
										set(result, key, parsedJson);
									}
								} catch {
									set(result, key, value);
								}
							}
						});

						saveQueue.push(obj);
					})
					.on('error', (err: any) => {
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
		format: 'xml' | 'csv' | 'json',
		options?: {
			file?: Partial<File>;
		}
	) {
		try {
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

				const totalCount = await service
					.readByQuery({
						...query,
						aggregate: {
							count: ['*'],
						},
					})
					.then((result) => Number(result?.[0]?.count ?? 0));

				const count = query.limit ? Math.min(totalCount, query.limit) : totalCount;

				const requestedLimit = query.limit ?? -1;
				const batchesRequired = Math.ceil(count / env.EXPORT_BATCH_SIZE);

				let readCount = 0;

				for (let batch = 0; batch < batchesRequired; batch++) {
					let limit = env.EXPORT_BATCH_SIZE;

					if (requestedLimit > 0 && env.EXPORT_BATCH_SIZE > requestedLimit - readCount) {
						limit = requestedLimit - readCount;
					}

					const result = await service.readByQuery({
						...query,
						limit,
						offset: batch * env.EXPORT_BATCH_SIZE,
					});

					readCount += result.length;

					if (result.length) {
						await appendFile(
							path,
							this.transform(result, format, {
								includeHeader: batch === 0,
								includeFooter: batch + 1 === batchesRequired,
							})
						);
					}
				}
			});

			const filesService = new FilesService({
				accountability: this.accountability,
				schema: this.schema,
			});

			const storage: string = toArray(env.STORAGE_LOCATIONS)[0];

			const title = `export-${collection}-${getDateFormatted()}`;
			const filename = `${title}.${format}`;

			const fileWithDefaults: Partial<File> & { storage: string; filename_download: string } = {
				...(options?.file ?? {}),
				title: options?.file?.title ?? title,
				filename_download: options?.file?.filename_download ?? filename,
				storage: options?.file?.storage ?? storage,
				type: mimeTypes[format],
			};

			const savedFile = await filesService.uploadOne(createReadStream(path), fileWithDefaults);

			if (this.accountability?.user) {
				const notificationsService = new NotificationsService({
					accountability: this.accountability,
					schema: this.schema,
				});

				await notificationsService.createOne({
					recipient: this.accountability.user,
					sender: this.accountability.user,
					subject: `Your export of ${collection} is ready`,
					collection: `directus_files`,
					item: savedFile,
				});
			}

			await cleanup();
		} catch (err: any) {
			logger.error(err, `Couldn't export ${collection}: ${err.message}`);

			if (this.accountability?.user) {
				const notificationsService = new NotificationsService({
					accountability: this.accountability,
					schema: this.schema,
				});

				await notificationsService.createOne({
					recipient: this.accountability.user,
					sender: this.accountability.user,
					subject: `Your export of ${collection} failed`,
					message: `Please contact your system administrator for more information.`,
				});
			}
		}
	}

	/**
	 * Transform a given input object / array to the given type
	 */
	transform(
		input: Record<string, any>[],
		format: 'xml' | 'csv' | 'json',
		options?: {
			includeHeader?: boolean;
			includeFooter?: boolean;
		}
	): string {
		if (format === 'json') {
			let string = JSON.stringify(input || null, null, '\t');

			if (options?.includeHeader === false) string = string.split('\n').slice(1).join('\n');

			if (options?.includeFooter === false) {
				const lines = string.split('\n');
				string = lines.slice(0, lines.length - 1).join('\n');
				string += ',\n';
			}

			return string;
		}

		if (format === 'xml') {
			let string = toXML('data', input);

			if (options?.includeHeader === false) string = string.split('\n').slice(2).join('\n');

			if (options?.includeFooter === false) {
				const lines = string.split('\n');
				string = lines.slice(0, lines.length - 1).join('\n');
				string += '\n';
			}

			return string;
		}

		if (format === 'csv') {
			if (input.length === 0) return '';
			const parser = new CSVParser({
				transforms: [CSVTransforms.flatten({ separator: '.' })],
				header: options?.includeHeader !== false,
			});

			let string = parser.parse(input);

			if (options?.includeHeader === false) {
				string = '\n' + string;
			}

			return string;
		}

		throw new ServiceUnavailableException(`Illegal export type used: "${format}"`, { service: 'export' });
	}
}
