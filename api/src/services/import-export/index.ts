import type { Accountability, File, Query, SchemaOverview } from '@directus/types';
import { parseJSON, toArray } from '@directus/utils';
import { queue } from 'async';
import destroyStream from 'destroy';
import { dump as toYAML } from 'js-yaml';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import type { Knex } from 'knex';
import { createReadStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import Papa from 'papaparse';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import env from '../../env.js';
import {
	ForbiddenError,
	InvalidPayloadError,
	ServiceUnavailableError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import logger from '../../logger.js';
import type { AbstractServiceOptions, ActionEventParams } from '../../types/index.js';
import { getDateFormatted } from '../../utils/get-date-formatted.js';
import { Url } from '../../utils/url.js';
import { userName } from '../../utils/user-name.js';
import { FilesService } from '../files.js';
import { ItemsService } from '../items.js';
import { NotificationsService } from '../notifications.js';
import { UsersService } from '../users.js';

type ExportFormat = 'csv' | 'json' | 'xml' | 'yaml';

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
		if (this.accountability?.admin !== true && collection.startsWith('directus_')) throw new ForbiddenError();

		const createPermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'create'
		);

		const updatePermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'update'
		);

		if (this.accountability?.admin !== true && (!createPermissions || !updatePermissions)) {
			throw new ForbiddenError();
		}

		switch (mimetype) {
			case 'application/json':
				return await this.importJSON(collection, stream);
			case 'text/csv':
			case 'application/vnd.ms-excel':
				return await this.importCSV(collection, stream);
			default:
				throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}
	}

	importJSON(collection: string, stream: Readable): Promise<void> {
		const extractJSON = StreamArray.withParser();
		const nestedActionEvents: ActionEventParams[] = [];

		return this.knex.transaction((trx) => {
			const service = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value, { bypassEmitAction: (params) => nestedActionEvents.push(params) });
			});

			return new Promise<void>((resolve, reject) => {
				stream.pipe(extractJSON);

				extractJSON.on('data', ({ value }: Record<string, any>) => {
					saveQueue.push(value);
				});

				extractJSON.on('error', (err: Error) => {
					destroyStream(stream);
					destroyStream(extractJSON);

					reject(new InvalidPayloadError({ reason: err.message }));
				});

				saveQueue.error((err) => {
					reject(err);
				});

				extractJSON.on('end', () => {
					saveQueue.drain(() => {
						for (const nestedActionEvent of nestedActionEvents) {
							emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
						}

						return resolve();
					});
				});
			});
		});
	}

	importCSV(collection: string, stream: Readable): Promise<void> {
		const nestedActionEvents: ActionEventParams[] = [];

		return this.knex.transaction((trx) => {
			const service = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value, { bypassEmitAction: (action) => nestedActionEvents.push(action) });
			});

			const transform = (value: string) => {
				if (value.length === 0) return;

				try {
					const parsedJson = parseJSON(value);

					if (typeof parsedJson === 'number') {
						return value;
					}

					return parsedJson;
				} catch {
					return value;
				}
			};

			const PapaOptions: Papa.ParseConfig = {
				header: true,
				transform,
			};

			return new Promise<void>((resolve, reject) => {
				stream
					.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, PapaOptions))
					.on('data', (obj: Record<string, unknown>) => {
						// Filter out all undefined fields
						for (const field in obj) {
							if (obj[field] === undefined) {
								delete obj[field];
							}
						}

						saveQueue.push(obj);
					})
					.on('error', (err: any) => {
						destroyStream(stream);
						reject(new InvalidPayloadError({ reason: err.message }));
					})
					.on('end', () => {
						// In case of empty CSV file
						if (!saveQueue.started) return resolve();

						saveQueue.drain(() => {
							for (const nestedActionEvent of nestedActionEvents) {
								emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
							}

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
		format: ExportFormat,
		options?: {
			file?: Partial<File>;
		}
	) {
		const { createTmpFile } = await import('@directus/utils/node');
		const tmpFile = await createTmpFile().catch(() => null);

		try {
			if (!tmpFile) throw new Error('Failed to create temporary file for export');

			const mimeTypes = {
				csv: 'text/csv',
				json: 'application/json',
				xml: 'text/xml',
				yaml: 'text/yaml',
			};

			const database = getDatabase();

			await database.transaction(async (trx) => {
				const service = new ItemsService(collection, {
					accountability: this.accountability,
					schema: this.schema,
					knex: trx,
				});

				const { primary } = this.schema.collections[collection]!;

				const sort = query.sort ?? [];

				if (sort.includes(primary) === false) {
					sort.push(primary);
				}

				const totalCount = await service
					.readByQuery({
						...query,
						aggregate: {
							count: ['*'],
						},
					})
					.then((result) => Number(result?.[0]?.['count'] ?? 0));

				const count = query.limit && query.limit > -1 ? Math.min(totalCount, query.limit) : totalCount;

				const requestedLimit = query.limit ?? -1;
				const batchesRequired = Math.ceil(count / env['EXPORT_BATCH_SIZE']);

				let readCount = 0;

				for (let batch = 0; batch < batchesRequired; batch++) {
					let limit = env['EXPORT_BATCH_SIZE'];

					if (requestedLimit > 0 && env['EXPORT_BATCH_SIZE'] > requestedLimit - readCount) {
						limit = requestedLimit - readCount;
					}

					const result = await service.readByQuery({
						...query,
						sort,
						limit,
						offset: batch * env['EXPORT_BATCH_SIZE'],
					});

					readCount += result.length;

					if (result.length) {
						await appendFile(
							tmpFile.path,
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

			const storage: string = toArray(env['STORAGE_LOCATIONS'])[0];

			const title = `export-${collection}-${getDateFormatted()}`;
			const filename = `${title}.${format}`;

			const fileWithDefaults: Partial<File> & { storage: string; filename_download: string } = {
				...(options?.file ?? {}),
				title: options?.file?.title ?? title,
				filename_download: options?.file?.filename_download ?? filename,
				storage: options?.file?.storage ?? storage,
				type: mimeTypes[format],
			};

			const savedFile = await filesService.uploadOne(createReadStream(tmpFile.path), fileWithDefaults);

			if (this.accountability?.user) {
				const notificationsService = new NotificationsService({
					accountability: this.accountability,
					schema: this.schema,
				});

				const usersService = new UsersService({
					schema: this.schema,
				});

				const user = await usersService.readOne(this.accountability.user, {
					fields: ['first_name', 'last_name', 'email'],
				});

				const href = new Url(env['PUBLIC_URL']).addPath('admin', 'files', savedFile).toString();

				const message = `
Hello ${userName(user)},

Your export of ${collection} is ready. <a href="${href}">Click here to view.</a>
`;

				await notificationsService.createOne({
					recipient: this.accountability.user,
					sender: this.accountability.user,
					subject: `Your export of ${collection} is ready`,
					message,
					collection: `directus_files`,
					item: savedFile,
				});
			}
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
		} finally {
			await tmpFile?.cleanup();
		}
	}

	/**
	 * Transform a given input object / array to the given type
	 */
	transform(
		input: Record<string, any>[],
		format: ExportFormat,
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

		if (format === 'yaml') {
			return toYAML(input);
		}

		throw new ServiceUnavailableError({ service: 'export', reason: `Illegal export type used: "${format}"` });
	}
}
